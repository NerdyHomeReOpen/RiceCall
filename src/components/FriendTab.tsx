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
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

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

const FriendTab: React.FC<FriendTabProps> = React.memo(({ user, friend, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const lang = useLanguage();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // Socket
  const socket = useSocket();

  // Refs
  const refreshed = useRef(false);

  // States
  const [friendServer, setFriendServer] = useState<Server>(Default.server());

  // Variables
  const { userId, currentServerId: userCurrentServerId } = user;
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
    isBlocked: friendIsBlocked,
    currentServerId: friendCurrentServerId,
  } = friend;
  const { name: friendServerName } = friendServer;
  const isCurrentUser = friendTargetId === friendUserId;
  const canManageFriend = !isCurrentUser && !friendIsBlocked;
  const isFriendOnline = friendStatus !== 'offline' && !friendIsBlocked;

  // Handlers
  const handleServerSelect = (userId: User['userId'], server: Server) => {
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.displayId);

    setTimeout(() => {
      socket.send.connectServer({ userId, serverId: server.serverId });
    }, loadingBox.loadingTimeStamp);
  };

  const handleDeleteFriend = (userId: User['userId'], targetId: User['userId']) => {
    if (!socket) return;
    handleOpenWarningDialog(lang.tr.deleteFriendDialog.replace('{0}', friendName), () =>
      socket.send.deleteFriend({ userId, targetId }),
    );
  };

  const handleServerUpdate = (data: Server) => {
    setFriendServer(data);
  };

  const handleOpenWarningDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
    ipcService.initialData.onRequest('warningDialog', {
      title: message,
      submitTo: 'warningDialog',
    });
    ipcService.popup.onSubmit('warningDialog', callback);
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, {
      userId,
      targetId,
      targetName,
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, {
      userId,
      targetId,
    });
  };

  const handleOpenEditFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.EDIT_FRIEND, 'editFriend');
    ipcService.initialData.onRequest('editFriend', {
      userId,
      targetId,
    });
  };

  const handleBlockFriend = (userId: User['userId'], targetId: User['userId'], isBlocked: UserFriend['isBlocked']) => {
    if (!socket) return;
    handleOpenWarningDialog(
      lang.getTranslatedMessage('確定要{blockType}好友 {userName} 嗎?', {
        blockType: isBlocked ? '解除封鎖' : '封鎖',
        userName: friendName,
      }),
      () =>
        socket.send.editFriend({
          friend: { isBlocked: !isBlocked },
          userId,
          targetId,
        }),
    );
  };

  useEffect(() => {
    if (!friendCurrentServerId) return;
    const refresh = async () => {
      Promise.all([
        getService.server({
          serverId: friendCurrentServerId,
        }),
      ]).then(([server]) => {
        if (server) handleServerUpdate(server);
      });
      refreshed.current = true;
    };
    refresh();
  }, [friendCurrentServerId]);

  return (
    <div key={friendTargetId}>
      {/* User View */}
      <div
        className={`${styles['friendCard']} ${selectedItemId === `${friendTargetId}` ? styles['selected'] : ''}`}
        onClick={() => setSelectedItemId(friendTargetId)}
        onContextMenu={(e) => {
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'driectMessage',
              label: '傳送即時訊息', // TODO: lang.tr
              show: !isCurrentUser,
              onClick: () => handleOpenDirectMessage(friendUserId, friendTargetId, friendName),
            },
            {
              id: 'separator',
              label: '',
              show: !isCurrentUser,
            },
            {
              id: 'info',
              label: lang.tr.viewProfile,
              show: !isCurrentUser,
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
              show: !isCurrentUser,
            },
            {
              id: 'permission-setting',
              label: '權限設定',
              show: canManageFriend && !friendIsBlocked,
              icon: 'submenu',
              hasSubmenu: true,
              submenuItems: [
                {
                  id: 'set-private',
                  label: '對好友隱藏上線', // TODO: lang.tr
                  show: canManageFriend && !friendIsBlocked,
                  disabled: true,
                  onClick: () => {
                    /* TODO: handlePrivateFriend() */
                  },
                },
                {
                  id: 'set-notify',
                  label: '好友上線提醒我', // TODO: lang.tr
                  show: canManageFriend && !friendIsBlocked,
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
              show: canManageFriend && !friendIsBlocked,
              onClick: () => handleOpenEditFriend(friendUserId, friendTargetId),
            },
            {
              id: 'setBlock',
              label: friendIsBlocked ? '解除封鎖' : '封鎖',
              show: !isCurrentUser,
              onClick: () => handleBlockFriend(friendUserId, friendTargetId, friendIsBlocked),
            },
            {
              id: 'delete',
              label: lang.tr.deleteFriend,
              show: !isCurrentUser,
              onClick: () => handleDeleteFriend(friendUserId, friendTargetId),
            },
          ]);
        }}
        onDoubleClick={() => handleOpenDirectMessage(friendUserId, friendTargetId, friendName)}
      >
        <div
          className={styles['avatarPicture']}
          style={{
            backgroundImage: `url(${friendAvatarUrl})`,
            filter: !isFriendOnline ? 'grayscale(100%)' : '',
          }}
          datatype={isFriendOnline && friendStatus !== 'online' ? friendStatus : ''}
        />
        <div className={styles['baseInfoBox']}>
          <div className={styles['container']}>
            {friendVip > 0 && <div className={`${vip['vipIcon']} ${vip[`vip-small-${friendVip}`]}`} />}
            <div className={`${styles['name']} ${friendVip > 0 ? styles['isVIP'] : ''}`}>{friendName}</div>
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
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
