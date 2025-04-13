import React, { useEffect, useState, useRef } from 'react';

// Types
import { PopupType, Channel, Server, User, Category } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import serverPage from '@/styles/serverPage.module.css';
import popup from '@/styles/common/popup.module.css';
import changeChannelOrder from '@/styles/popups/changeChannelOrder.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

interface ChangeChannelOrderPopupProps {
  userId: string;
  serverId: string;
  channelId: string;
  channel: Channel;
  expanded: Record<string, boolean>;
}

const ChangeChannelOrderPopup: React.FC<ChangeChannelOrderPopupProps> =
  React.memo((initialData: ChangeChannelOrderPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshed = useRef(false);

    // States
    const [channelList, setChannelList] = useState<Channel[]>();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [channelActiveId, setChannelActiveId] = useState<string | null>(null);

    // Variables
    const { userId, serverId, channelId } = initialData;

    const handleChannelListUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      setChannelList(data);
    };

    useEffect(() => {
      if (!userId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.serverChannels({
            serverId,
          }),
        ]).then(([userServers]) => {
          handleChannelListUpdate(userServers);
        });
      };
      refresh();
    }, [serverId, userId]);

    // Effect
    useEffect(() => {
      if (!channelList || !expanded) return;
      console.log(channelList);
      for (const channel of channelList) {
        setExpanded((prev) => ({
          ...prev,
          [channel.channelId]: true,
        }));
      }
    }, [channelList]);

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(channelActiveId ?? channelId, serverId),
      );
    };

    const handleDeleteChannel = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleOpenCreateChannel = (
      serverId: Server['serverId'],
      categoryId: Category['categoryId'],
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId,
        userId,
      });
    };

    // TOOLS
    const canRename = channelList?.some(
      (ch) => ch.channelId === channelActiveId && !ch.isLobby,
    );
    const canDelete = channelList?.some(
      (ch) => ch.channelId === channelActiveId && !ch.isLobby,
    );

    // TODO
    const targetChannel = channelList?.find(
      (ch) => ch.channelId === channelActiveId,
    );
    const isCategory = targetChannel?.type?.toString() === 'category';
    const inSameGroupChannels = channelList
      ?.filter((ch) => {
        if (isCategory) return ch.type?.toString() === 'category';
        if (targetChannel?.categoryId)
          return ch.categoryId === targetChannel.categoryId;
        return ch.type?.toString() === 'channel' && !ch.categoryId;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const isFirst =
      inSameGroupChannels?.[0]?.channelId === targetChannel?.channelId;
    const isLast =
      inSameGroupChannels?.[inSameGroupChannels.length - 1]?.channelId ===
      targetChannel?.channelId;
    const canMoveUp = !targetChannel?.isLobby && !isFirst;
    const canMoveDown = !targetChannel?.isLobby && !isLast;
    // const canMoveTop = !isLobby && !isFirst;
    // const canMoveBottom = !isLobby && !isLast;

    const renderGroupedChannels = () => {
      if (!channelList) return null;
      const sortedChannelList = [...channelList].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      const renderChannel = (channel: Channel) => (
        <div
          key={channel.channelId}
          className={`${changeChannelOrder['changeOrderTab']} ${
            serverPage['channelTab']
          } ${channel.categoryId ? changeChannelOrder['changeOrderSub'] : ''} ${
            channelActiveId === channel.channelId
              ? changeChannelOrder['channelActive']
              : ''
          }`}
          onClick={() => setChannelActiveId(channel.channelId)}
        >
          <div
            className={`${serverPage['tabIcon']} ${
              expanded[channel.channelId] ? serverPage['expanded'] : ''
            } ${serverPage[channel.visibility]} ${
              channel.isLobby ? serverPage['lobby'] : ''
            }`}
          ></div>
          <div className={serverPage['channelTabLable']}>{channel.name}</div>
        </div>
      );
      return (
        <>
          {sortedChannelList.map((channel) => {
            if ((channel.type as string) === 'category') {
              const children = sortedChannelList.filter(
                (c) => c.categoryId === channel.channelId,
              );
              return (
                <div key={channel.channelId}>
                  {renderChannel(channel)}

                  <div className={serverPage['channelList']}>
                    {children.map(renderChannel)}
                  </div>
                </div>
              );
            }
            // 非分類 & 非分類內的頻道
            if (!channel.categoryId) {
              return renderChannel(channel);
            }
            return null;
          })}
        </>
      );
    };

    const channelListItem = (
      <div
        className={`${changeChannelOrder['changeOrderChannelList']} ${serverPage['channelList']}`}
      >
        {renderGroupedChannels()}
      </div>
    );

    const isActiveChannelCategory = channelList?.some(
      (ch) => ch.channelId === channelActiveId && !ch.categoryId && !ch.isLobby,
    );

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={changeChannelOrder['body']}>
            <div className={changeChannelOrder['toolsBar']}>
              <div
                className={`${changeChannelOrder['addChannelBtn']} ${
                  !isActiveChannelCategory
                    ? changeChannelOrder['disabledBtn']
                    : ''
                }`}
                onClick={() => {
                  if (!isActiveChannelCategory) return;
                  const targetChannelId = channelActiveId ?? channelId;
                  handleOpenCreateChannel(serverId, targetChannelId, userId);
                }}
              >
                新建
              </div>
              <div
                className={`${changeChannelOrder['changeChannelNameBtn']} ${
                  !canRename ? changeChannelOrder['disabledBtn'] : ''
                }`}
                onClick={() => {
                  if (!canRename) return;
                }}
              >
                改名
              </div>
              <div
                className={`${changeChannelOrder['deleteChannelBtn']} ${
                  !canDelete ? changeChannelOrder['disabledBtn'] : ''
                }`}
                onClick={() => handleOpenWarning(lang.tr.warningDeleteChannel)}
              >
                刪除
              </div>
              <div
                className={`${changeChannelOrder['upChannelOrderBtn']} ${
                  !canMoveUp || !isActiveChannelCategory
                    ? changeChannelOrder['disabledBtn']
                    : ''
                }`}
                onClick={() => {
                  if (!canMoveUp) return;
                }}
              >
                上移
              </div>

              <div
                className={`${changeChannelOrder['downChannelOrderBtn']} ${
                  !canMoveDown || !isActiveChannelCategory
                    ? changeChannelOrder['disabledBtn']
                    : ''
                }`}
                onClick={() => {
                  if (!canMoveDown) return;
                }}
              >
                下移
              </div>

              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['topChannelOrderBtn']}`}
              >
                置頂
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['bottomChannelOrderBtn']}`}
              >
                置底
              </div>
            </div>
            {channelListItem}
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
  });

ChangeChannelOrderPopup.displayName = 'ChangeChannelOrderPopup';

export default ChangeChannelOrderPopup;
