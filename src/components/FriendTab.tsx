import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Types
import { PopupType, User, UserFriend, Server } from '@/types';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import Default from '@/utils/default';

// Components
import BadgeList from '@/components/BadgeList';

interface FriendTabProps {
  user: User;
  friend: UserFriend;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(
  ({ user, friend, selectedItemId, setSelectedItemId }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Socket
    const socket = useSocket();

    // Refs
    const refreshed = useRef(false);

    // States
    const [friendServer, setFriendServer] = useState<Server>(Default.server());

    // Variables
    const { userId } = user;
    const {
      userId: friendUserId,
      targetId: friendTargetId,
      name: friendName,
      avatarUrl: friendAvatarUrl,
      signature: friendSignature,
      vip: friendVip,
      level: friendLevel,
      badges: friendBadges,
      status: friendStatus,
      currentServerId: friendCurrentServerId,
      online: friendOnlineStatus = null,
    } = friend;
    const { name: friendServerName } = friendServer;
    const isCurrentUser = friendTargetId === friendUserId;
    const canManageFriend = !isCurrentUser;
    const isFriendOnline = friendOnlineStatus ?? friendCurrentServerId !== null;

    // Handlers
    const handleServerSelect = (userId: User['userId'], server: Server) => {
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: server.displayId,
          timestamp: Date.now(),
        }),
      );
      setTimeout(() => {
        socket.send.connectServer({ userId, serverId: server.serverId });
      }, 1500);
    };

    const handleDeleteFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.deleteFriendDialog.replace('{0}', friendName),
        () => socket.send.deleteFriend({ userId, targetId }),
      );
    };

    const handleServerUpdate = (data: Server) => {
      setFriendServer(data);
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(
        PopupType.DIRECT_MESSAGE,
        `directMessage-${targetId}`,
      );
      ipcService.initialData.onRequest(`directMessage-${targetId}`, {
        userId,
        targetId,
        targetName,
      });
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
      ipcService.initialData.onRequest(`userInfo-${targetId}`, {
        userId,
        targetId,
      });
    };

    const handleOpenEditFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_FRIEND, 'editFriend');
      ipcService.initialData.onRequest('editFriend', {
        userId,
        targetId,
      });
    };

    useEffect(() => {
      if (!friendCurrentServerId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.server({
            serverId: friendCurrentServerId,
          }),
        ]).then(([server]) => {
          if (server) handleServerUpdate(server);
        });
      };
      refresh();
    }, [friendCurrentServerId]);

    return (
      <div key={friendTargetId}>
        {/* User View */}
        <div
          className={`${styles['friendCard']} ${
            selectedItemId === `${friendTargetId}` ? styles['selected'] : ''
          }`}
          onClick={() => setSelectedItemId(friendTargetId)}
          onContextMenu={(e) => {
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'driectMessage',
                label: '傳送即時訊息', // TODO: lang.tr
                show: !isCurrentUser,
                onClick: () =>
                  handleOpenDirectMessage(
                    friendUserId,
                    friendTargetId,
                    friendName,
                  ),
              },
              {
                id: 'separator',
                label: '',
                show: canManageFriend,
              },
              {
                id: 'info',
                label: lang.tr.viewProfile,
                show: canManageFriend,
                onClick: () => handleOpenUserInfo(friendUserId, friendTargetId),
              },
              {
                id: 'editNote',
                label: '修改備註', // TODO: lang.tr
                show: canManageFriend,
                disabled: true,
                onClick: () => {
                  /* handleFriendNote() */
                },
              },
              {
                id: 'separator',
                label: '',
                show: canManageFriend,
              },
              {
                id: 'permission-setting',
                label: '權限設定',
                show: canManageFriend,
                icon: 'submenu',
                hasSubmenu: true,
                submenuItems: [
                  {
                    id: 'set-private',
                    label: '對好友隱藏上線', // TODO: lang.tr
                    show: canManageFriend,
                    disabled: true,
                    onClick: () => {
                      /* TODO: handlePrivateFriend() */
                    },
                  },
                  {
                    id: 'set-notify',
                    label: '好友上線提醒我', // TODO: lang.tr
                    show: canManageFriend,
                    disabled: true,
                    onClick: () => {
                      /* TODO: handleNotifyFriendOnline() */
                    },
                  },
                ],
              },
              {
                id: 'editGroup',
                label: lang.tr.editFriendGroup,
                show: canManageFriend,
                onClick: () =>
                  handleOpenEditFriend(friendUserId, friendTargetId),
              },
              {
                id: 'setBlock',
                label: '封鎖', // TODO: lang.tr
                show: canManageFriend,
                disabled: true,
                onClick: () => {
                  /* TODO: handleBlocdFriend */
                },
              },
              {
                id: 'delete',
                label: lang.tr.deleteFriend,
                show: canManageFriend,
                onClick: () => handleDeleteFriend(friendUserId, friendTargetId),
              },
            ]);
          }}
          onDoubleClick={() =>
            handleOpenDirectMessage(friendUserId, friendTargetId, friendName)
          }
        >
          <div
            className={styles['avatarPicture']}
            style={{
              backgroundImage: `url(${friendAvatarUrl})`,
              filter: !isFriendOnline ? 'grayscale(100%)' : '',
            }}
            datatype={
              isFriendOnline && friendStatus !== 'online' ? friendStatus : ''
            }
          />
          <div className={styles['baseInfoBox']}>
            <div className={styles['container']}>
              {friendVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${
                    vip[`vip-small-${friendVip}`]
                  }`}
                />
              )}
              <div
                className={`${styles['name']} ${
                  friendVip > 0 ? styles['isVIP'] : ''
                }`}
              >
                {friendName}
              </div>
              <div
                className={`
                  ${styles['gradeIcon']} 
                  ${grade['grade']} 
                  ${grade[`lv-${Math.min(56, friendLevel)}`]}
                `}
              />
              <BadgeList badges={friendBadges} maxDisplay={5} />
            </div>
            {isFriendOnline && friendCurrentServerId ? (
              <div
                className={`
                  ${styles['container']}
                  ${friendCurrentServerId ? styles['hasServer'] : ''}
                `}
                onClick={() => {
                  handleServerSelect(userId, friendServer);
                }}
              >
                <div className={styles['location']} />
                <div className={styles['serverName']}>{friendServerName}</div>
              </div>
            ) : (
              <div className={styles['signature']}>{friendSignature}</div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FriendTab.displayName = 'FriendTab';

export default FriendTab;
