import React, { useEffect, useState, useRef } from 'react';

// Types
import {
  PopupType,
  Channel,
  Category,
  Server,
  User,
  SocketServerEvent,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import editChannelOrder from '@/styles/popups/editChannelOrder.module.css';
import serverPage from '@/styles/serverPage.module.css';
import popup from '@/styles/common/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

interface EditChannelOrderPopupProps {
  userId: string;
  serverId: string;
}

const EditChannelOrderPopup: React.FC<EditChannelOrderPopupProps> = React.memo(
  (initialData: EditChannelOrderPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshed = useRef(false);
    const map = useRef<Record<string, number>>({});

    // States
    const [serverChannels, setServerChannels] = useState<
      (Channel | Category)[]
    >([]);
    const [selectedChannel, setSelectedChannel] = useState<
      Channel | Category | null
    >(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Variables
    const { userId, serverId } = initialData;
    const isSelected = !!selectedChannel;
    const isLobbyChannel = selectedChannel?.isLobby;
    const selectedCategoryId = selectedChannel?.categoryId;
    const selectedChannelId = selectedChannel?.channelId;
    const selectedGroupChannels = serverChannels.filter((ch) =>
      selectedCategoryId
        ? ch.categoryId === selectedCategoryId
        : !ch.categoryId,
    );
    const currentIndex = selectedGroupChannels.findIndex(
      (ch) => ch.channelId === selectedChannelId,
    );
    const upperChannel = selectedGroupChannels[currentIndex - 1];
    const firstChannel = selectedGroupChannels[0];
    const lastChannel = selectedGroupChannels[selectedGroupChannels.length - 1];
    const isFirst = firstChannel?.channelId === selectedChannelId;
    const isLast = lastChannel?.channelId === selectedChannelId;
    const canRename = isSelected && !isLobbyChannel;
    const canDelete = isSelected && !isLobbyChannel;
    const canMoveUp =
      isSelected && !isFirst && !isLobbyChannel && !upperChannel?.isLobby;
    const canMoveDown = isSelected && !isLast && !isLobbyChannel;

    const canTop =
      isSelected &&
      !isLobbyChannel &&
      currentIndex > 0 &&
      !firstChannel?.isLobby;
    const canBottom =
      isSelected &&
      !isLobbyChannel &&
      currentIndex < selectedGroupChannels.length - 1;

    const handleServerChannelsUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      setServerChannels(data);
      data.forEach((ch) => {
        map.current[ch.channelId] = ch.order;
      });
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () => {
        if (!selectedChannel) return;
        handleDeleteChannel(selectedChannel.channelId, serverId);
      });
    };

    const handleUpdateChannels = (
      channels: Partial<Channel>[],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateChannels({ channels, serverId });
    };

    const handleDeleteChannel = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleOpenCreateChannel = (
      userId: User['userId'],
      categoryId: Category['categoryId'] | null,
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        userId,
        serverId,
        categoryId,
      });
    };

    const handleChangeOrder = (currentIndex: number, targetIndex: number) => {
      if (currentIndex === targetIndex) return;
      if (currentIndex < 0 || currentIndex > serverChannels.length - 1) return;
      if (targetIndex < 0 || targetIndex > serverChannels.length - 1) return;

      const newChannels = [...serverChannels];

      if (currentIndex < targetIndex) {
        for (let i = currentIndex; i < targetIndex; i++) {
          const temp = newChannels[i].order;
          const tempChannel = newChannels[i];
          newChannels[i].order = newChannels[i + 1].order;
          newChannels[i] = newChannels[i + 1];
          newChannels[i + 1].order = temp;
          newChannels[i + 1] = tempChannel;
        }
      } else {
        for (let i = currentIndex; i > targetIndex; i--) {
          const temp = newChannels[i].order;
          const tempChannel = newChannels[i];
          newChannels[i].order = newChannels[i - 1].order;
          newChannels[i - 1].order = temp;
          newChannels[i] = newChannels[i - 1];
          newChannels[i - 1] = tempChannel;
        }
      }

      setServerChannels(newChannels);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUnselect = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(`.${serverPage['channelTab']}`) ||
        target.closest('[class*="Btn"]')
      ) {
        return;
      }
      setSelectedChannel(null);
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.SERVER_CHANNELS_UPDATE]: handleServerChannelsUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!userId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.serverChannels({
            serverId,
          }),
        ]).then(([userServers]) => {
          handleServerChannelsUpdate(userServers);
        });
      };
      refresh();
    }, [serverId, userId]);

    useEffect(() => {
      for (const channel of serverChannels) {
        setExpanded((prev) => ({
          ...prev,
          [channel.channelId]: true,
        }));
      }
    }, [serverChannels]);

    const categoryTab = (category: Category) => {
      const {
        channelId: categoryId,
        name: categoryName,
        visibility: categoryVisibility,
        isLobby: categoryIsLobby,
        order: categoryOrder,
      } = category;
      const subChannels = serverChannels?.filter(
        (ch) => ch.categoryId === categoryId,
      );
      const isSelected = selectedChannelId === categoryId;

      return (
        <div key={categoryId}>
          <div
            className={`
              ${serverPage['channelTab']}
              ${isSelected ? editChannelOrder['selected'] : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChannel((prev) =>
                prev?.channelId === categoryId ? null : category,
              );
            }}
          >
            <div
              className={`
                ${serverPage['tabIcon']}
                ${expanded[categoryId] ? serverPage['expanded'] : ''}
                ${serverPage[categoryVisibility]}
                ${categoryIsLobby ? serverPage['lobby'] : ''}
              `}
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [categoryId]: !prev[categoryId],
                }))
              }
            />
            <div
              className={`${serverPage['channelTabLable']} ${editChannelOrder['channelTabBox']}`}
            >
              {categoryName}
              <div className={editChannelOrder['channelTabIndex']}>
                {`(${categoryOrder})`}
              </div>
            </div>
          </div>
          <div className={serverPage['channelList']}>
            {expanded[categoryId] &&
              subChannels
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .filter((ch) => ch.type === 'channel')
                .map((channel) => channelTab(channel))}
          </div>
        </div>
      );
    };

    const channelTab = (channel: Channel) => {
      const {
        channelId,
        name: channelName,
        visibility: channelVisibility,
        isLobby: channelIsLobby,
        order: channelOrder,
      } = channel;
      const isSelected = selectedChannelId === channelId;

      return (
        <div
          key={channelId}
          className={`
          ${serverPage['channelTab']}
          ${isSelected ? editChannelOrder['selected'] : ''}
        `}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedChannel((prev) =>
              prev?.channelId === channelId ? null : channel,
            );
          }}
        >
          <div
            className={`
            ${serverPage['tabIcon']}
            ${serverPage[channelVisibility]}
            ${channelIsLobby ? serverPage['lobby'] : ''}
          `}
          />
          <div
            className={`${serverPage['channelTabLable']} ${editChannelOrder['channelTabBox']}`}
          >
            {channelName}
            <div className={editChannelOrder['channelTabIndex']}>
              {`(${channelOrder})`}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className={popup['popupContainer']}>
        <div className={editChannelOrder['header']} onClick={handleUnselect}>
          <div
            className={`${editChannelOrder['addChannelBtn']} ${
              isLobbyChannel ? editChannelOrder['disabledBtn'] : ''
            }`}
            onClick={() => {
              if (isLobbyChannel) return;
              handleOpenCreateChannel(
                userId,
                selectedChannelId ?? null,
                serverId,
              );
            }}
          >
            新建
          </div>

          <div
            className={`
              ${editChannelOrder['changeChannelNameBtn']} 
              ${!canRename ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canRename) return;
            }}
          >
            改名
          </div>

          <div
            className={`
              ${editChannelOrder['deleteChannelBtn']} 
              ${!canDelete ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => handleOpenWarning(lang.tr.warningDeleteChannel)}
          >
            刪除
          </div>

          <div
            className={`
              ${editChannelOrder['upChannelOrderBtn']} 
              ${!canMoveUp ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canMoveUp) return;
              const currentIndex = serverChannels.findIndex(
                (ch) => ch.channelId === selectedChannelId,
              );
              handleChangeOrder(currentIndex, currentIndex - 1);
            }}
          >
            上移
          </div>

          <div
            className={`
              ${editChannelOrder['downChannelOrderBtn']} 
              ${!canMoveDown ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canMoveDown) return;
              const currentIndex = serverChannels.findIndex(
                (ch) => ch.channelId === selectedChannelId,
              );
              handleChangeOrder(currentIndex, currentIndex + 1);
            }}
          >
            下移
          </div>

          <div
            className={`
              ${editChannelOrder['topChannelOrderBtn']}
              ${!canTop ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canTop) return;
              const currentIndex = serverChannels.findIndex(
                (ch) => ch.channelId === selectedChannelId,
              );
              handleChangeOrder(currentIndex, 0);
            }}
          >
            置頂
          </div>

          <div
            className={`
              ${editChannelOrder['bottomChannelOrderBtn']}
              ${!canBottom ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canBottom) return;
              const currentIndex = serverChannels.findIndex(
                (ch) => ch.channelId === selectedChannelId,
              );
              handleChangeOrder(currentIndex, serverChannels.length - 1);
            }}
          >
            置底
          </div>
        </div>

        <div className={popup['popupBody']} onClick={handleUnselect}>
          <div className={editChannelOrder['body']}>
            <div
              className={serverPage['channelList']}
              onClick={(e) => e.stopPropagation()}
            >
              {serverChannels
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .filter((ch) => !ch.categoryId)
                .map((channel) => {
                  if (channel.type === 'category') {
                    return categoryTab(channel);
                  }
                  return channelTab(channel);
                })}
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            onClick={() => {
              const editedChannels: Partial<Channel>[] = [];
              serverChannels
                .filter((ch) => !ch.categoryId)
                .forEach((ch, index) => {
                  if (
                    ch.order !== index ||
                    ch.order !== map.current[ch.channelId]
                  ) {
                    editedChannels.push({
                      order: index,
                      channelId: ch.channelId,
                    });
                  }
                  serverChannels
                    .filter((sch) => sch.categoryId === ch.channelId)
                    .forEach((sch, sindex) => {
                      if (
                        sch.order !== sindex ||
                        sch.order !== map.current[sch.channelId]
                      ) {
                        editedChannels.push({
                          order: sindex,
                          channelId: sch.channelId,
                        });
                      }
                    });
                });
              if (editedChannels.length > 0) {
                handleUpdateChannels(editedChannels, serverId);
              }
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

EditChannelOrderPopup.displayName = 'EditChannelOrderPopup';

export default EditChannelOrderPopup;
