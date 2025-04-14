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
import changeChannelOrder from '@/styles/popups/changeChannelOrder.module.css';
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
    const { channelId: selectedChannelId, categoryId: selectedCategoryId } =
      selectedChannel ?? {};
    const canRename = selectedChannel && !selectedChannel.isLobby;
    const canDelete = selectedChannel && !selectedChannel.isLobby;
    const selectedGroupChannels = serverChannels?.filter((ch) => {
      if (selectedCategoryId) return ch.categoryId === selectedCategoryId;
      return !ch.categoryId;
    });
    const isFirst = selectedGroupChannels[0].channelId === selectedChannelId;
    const isLast =
      selectedGroupChannels[selectedGroupChannels.length - 1].channelId ===
      selectedChannelId;
    const canMoveUp = selectedChannel && !selectedChannel.isLobby && !isFirst;
    const canMoveDown = selectedChannel && !selectedChannel.isLobby && !isLast;

    const handleServerChannelsUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      setServerChannels(data);
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

    const handleClose = () => {
      ipcService.window.close();
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
      } = category;
      const subChannels = serverChannels?.filter(
        (ch) => ch.categoryId === categoryId,
      );
      const isSelected = selectedChannel?.channelId === categoryId;

      return (
        <>
          <div
            key={categoryId}
            className={`
              ${serverPage['channelTab']}
              ${isSelected ? changeChannelOrder['selected'] : ''}
            `}
            onClick={() =>
              setSelectedChannel((prev) =>
                prev?.channelId === categoryId ? null : category,
              )
            }
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
            <div className={serverPage['channelTabLable']}>{categoryName}</div>
          </div>
          <div className={serverPage['channelList']}>
            {expanded[categoryId] &&
              subChannels
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .filter((ch) => ch.type === 'channel')
                .map((channel) => channelTab(channel))}
          </div>
        </>
      );
    };

    const channelTab = (channel: Channel) => {
      const {
        channelId,
        name: channelName,
        visibility: channelVisibility,
        isLobby: channelIsLobby,
      } = channel;
      const isSelected = selectedChannel?.channelId === channelId;

      return (
        <div
          key={channelId}
          className={`
          ${serverPage['channelTab']}
          ${isSelected ? changeChannelOrder['selected'] : ''}
        `}
          onClick={() =>
            setSelectedChannel((prev) =>
              prev?.channelId === channelId ? null : channel,
            )
          }
        >
          <div
            className={`
            ${serverPage['tabIcon']}
            ${serverPage[channelVisibility]}
            ${channelIsLobby ? serverPage['lobby'] : ''}
          `}
          />
          <div className={serverPage['channelTabLable']}>{channelName}</div>
        </div>
      );
    };

    return (
      <div className={popup['popupContainer']}>
        <div className={changeChannelOrder['header']}>
          <div
            className={`
              ${changeChannelOrder['addChannelBtn']} 
            `}
            onClick={() => {
              handleOpenCreateChannel(
                userId,
                selectedChannel?.channelId ?? null,
                serverId,
              );
            }}
          >
            新建
          </div>

          <div
            className={`
              ${changeChannelOrder['changeChannelNameBtn']} 
              ${!canRename ? changeChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canRename) return;
            }}
          >
            改名
          </div>

          <div
            className={`
              ${changeChannelOrder['deleteChannelBtn']} 
              ${!canDelete ? changeChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => handleOpenWarning(lang.tr.warningDeleteChannel)}
          >
            刪除
          </div>

          <div
            className={`
              ${changeChannelOrder['upChannelOrderBtn']} 
              ${!canMoveUp ? changeChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canMoveUp) return;
            }}
          >
            上移
          </div>

          <div
            className={`
              ${changeChannelOrder['downChannelOrderBtn']} 
              ${!canMoveDown ? changeChannelOrder['disabledBtn'] : ''}
            `}
            onClick={() => {
              if (!canMoveDown) return;
            }}
          >
            下移
          </div>

          <div
            className={`
              ${changeChannelOrder['disabledBtn']} 
              ${changeChannelOrder['topChannelOrderBtn']}
            `}
          >
            置頂
          </div>

          <div
            className={`
              ${changeChannelOrder['disabledBtn']} 
              ${changeChannelOrder['bottomChannelOrderBtn']}
            `}
          >
            置底
          </div>
        </div>

        <div className={popup['popupBody']}>
          <div className={changeChannelOrder['body']}>
            <div className={serverPage['channelList']}>
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
          <button className={`${popup['button']}`}>{lang.tr.confirm}</button>
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
