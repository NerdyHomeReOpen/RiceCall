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
import serverPage from '@/styles/pages/server.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

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
    const [groupChannels, setGroupChannels] = useState<(Channel | Category)[]>(
      [],
    );
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Variables
    const { userId, serverId } = initialData;
    const isSelected = selectedChannel;
    const { channelId: selectedChannelId, isLobby } =
      selectedChannel ?? createDefault.channel();
    const currentIndex = groupChannels.findIndex(
      (ch) => ch.channelId === selectedChannelId,
    );
    const firstChannel = groupChannels[0];
    const lastChannel = groupChannels[groupChannels.length - 1];
    const isFirst =
      firstChannel && firstChannel.channelId === selectedChannelId;
    const isLast = lastChannel && lastChannel.channelId === selectedChannelId;
    const canRename = isSelected && !isLobby;
    const canDelete = isSelected && !isLobby;
    const canMoveUp = isSelected && !isFirst && !isLobby && currentIndex > 0;
    const canMoveDown =
      isSelected &&
      !isLast &&
      !isLobby &&
      currentIndex < groupChannels.length - 1;
    const canTop = isSelected && !isFirst && !isLobby;
    const canBottom = isSelected && !isLast && !isLobby;
    const canAdd = !isLobby && !selectedChannel?.categoryId;

    const handleServerChannelsUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      data = data.filter((ch) => !ch.isLobby);
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
      if (selectedChannel?.channelId === channelId) {
        setSelectedChannel(null);
      }
    };

    const handleOpenCreateChannel = (
      userId: User['userId'],
      channelId: Channel['channelId'] | null,
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        userId,
        serverId,
        channelId,
      });
    };

    const handleEditChannelName = () => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL_NAME);
      ipcService.initialData.onRequest(
        PopupType.EDIT_CHANNEL_NAME,
        selectedChannel,
      );
    };

    const handleChangeOrder = (currentIndex: number, targetIndex: number) => {
      if (currentIndex === targetIndex) return;
      if (currentIndex < 0 || currentIndex > serverChannels.length - 1) return;
      if (targetIndex < 0 || targetIndex > serverChannels.length - 1) return;

      const newServerChannels = [...serverChannels];
      const newGroupChannels = [...groupChannels];

      if (currentIndex < targetIndex) {
        for (let i = currentIndex; i < targetIndex; i++) {
          const temp = newGroupChannels[currentIndex].order;
          newGroupChannels[currentIndex].order = newGroupChannels[i + 1].order;
          newGroupChannels[i + 1].order = temp;
        }
      } else {
        for (let i = currentIndex; i > targetIndex; i--) {
          const temp = newGroupChannels[currentIndex].order;
          newGroupChannels[currentIndex].order = newGroupChannels[i - 1].order;
          newGroupChannels[i - 1].order = temp;
        }
      }

      for (const ch of newGroupChannels) {
        const index = newServerChannels.findIndex(
          (sch) => sch.channelId === ch.channelId,
        );
        if (index !== -1) {
          newServerChannels[index].order = ch.order;
        }
      }
      setServerChannels(newServerChannels.sort((a, b) => a.order - b.order));
      setGroupChannels(newGroupChannels.sort((a, b) => a.order - b.order));
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
          [channel.channelId]:
            prev[channel.channelId] != undefined
              ? prev[channel.channelId]
              : true,
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
              setSelectedChannel(
                selectedChannelId === categoryId ? null : category,
              );
              setGroupChannels(
                serverChannels
                  .filter((ch) => !ch.categoryId)
                  .sort((a, b) =>
                    a.order !== b.order
                      ? a.order - b.order
                      : a.createdAt - b.createdAt,
                  ),
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
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => ({
                  ...prev,
                  [categoryId]: !prev[categoryId],
                }));
              }}
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
          <div
            className={serverPage['channelList']}
            style={{
              display: expanded[categoryId] ? 'block' : 'none',
            }}
          >
            {subChannels
              .sort((a, b) =>
                a.order !== b.order
                  ? a.order - b.order
                  : a.createdAt - b.createdAt,
              )
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
        categoryId: channelCategoryId,
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
            setSelectedChannel(
              selectedChannelId === channelId ? null : channel,
            );
            setGroupChannels(
              serverChannels
                .filter((ch) => ch.categoryId === channelCategoryId)
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                ),
            );
          }}
        >
          <div
            className={`
              ${serverPage['tabIcon']}
              ${serverPage[channelVisibility]}
              ${channelIsLobby ? serverPage['lobby'] : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
            }}
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
            className={`
              ${editChannelOrder['addChannelBtn']} 
              ${!canAdd ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canAdd) return;
              handleOpenCreateChannel(
                userId,
                selectedChannelId || null,
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
              handleEditChannelName();
            }}
          >
            改名
          </div>

          <div
            className={`
              ${editChannelOrder['deleteChannelBtn']} 
              ${!canDelete ? editChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!selectedChannel) return;
              handleOpenWarning(
                lang.tr.warningDeleteChannel.replace(
                  '{0}',
                  selectedChannel.name,
                ),
              );
            }}
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
              handleChangeOrder(currentIndex, groupChannels.length - 1);
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
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                )
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
