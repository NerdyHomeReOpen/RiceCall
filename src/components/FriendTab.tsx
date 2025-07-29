import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Types
import { User, UserFriend, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
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
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // Refs
  const refreshed = useRef(false);

  // States
  const [friendServer, setFriendServer] = useState<Server>(Default.server());

  // Variables
  const { currentServerId: userCurrentServerId } = user;
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
  const handleServerSelect = (server: Server) => {
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.displayId);

    setTimeout(() => {
      ipcService.socket.send('connectServer', { serverId: server.serverId });
    }, loadingBox.loadingTimeStamp);
  };

  const handleDeleteFriend = (targetId: User['userId']) => {
    handleOpenWarningDialog(t('confirm-delete-friend', { '0': friendName }), () => ipcService.socket.send('deleteFriend', { targetId }));
  };

  const handleServerUpdate = (data: Server) => {
    setFriendServer(data);
  };

  const handleOpenWarningDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogWarning', 'warningDialog');
    ipcService.initialData.onRequest('warningDialog', { message: message, submitTo: 'warningDialog' });
    ipcService.popup.onSubmit('warningDialog', callback);
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenEditFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('editFriend', 'editFriend');
    ipcService.initialData.onRequest('editFriend', { userId, targetId });
  };

  const handleBlockFriend = (targetId: User['userId'], isBlocked: UserFriend['isBlocked']) => {
    handleOpenWarningDialog(t('confirmBlockFriend', { blockType: isBlocked ? t('unblock') : t('block'), userName: friendName }), () =>
      ipcService.socket.send('editFriend', { targetId, update: { isBlocked: !isBlocked } }),
    );
  };

  useEffect(() => {
    if (!friendCurrentServerId) return;
    const refresh = async () => {
      getService.server({ serverId: friendCurrentServerId }).then((server) => {
        if (server) handleServerUpdate(server);
      });
      refreshed.current = true;
    };
    refresh();
  }, [friendCurrentServerId]);

  return (
    <div
      key={friendTargetId}
      className={`${styles['friend-tab']} ${selectedItemId === `${friendTargetId}` ? styles['selected'] : ''}`}
      onClick={() => setSelectedItemId(friendTargetId)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isCurrentUser,
            onClick: () => handleOpenDirectMessage(friendUserId, friendTargetId, friendName),
          },
          {
            id: 'separator',
            label: '',
            show: !isCurrentUser,
          },
          {
            id: 'view-profile',
            label: t('view-profile'),
            show: !isCurrentUser,
            onClick: () => handleOpenUserInfo(friendUserId, friendTargetId),
          },
          {
            id: 'edit-note',
            label: t('edit-note'),
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
            label: t('permission-setting'),
            show: canManageFriend && !friendIsBlocked,
            icon: 'submenu',
            hasSubmenu: true,
            submenuItems: [
              {
                id: 'set-hide-or-show-online-to-friend',
                label: t('hide-online-to-friend'),
                show: canManageFriend && !friendIsBlocked,
                disabled: true,
                onClick: () => {
                  /* TODO: handlePrivateFriend() */
                },
              },
              {
                id: 'set-notify-friend-online',
                label: t('notify-friend-online'),
                show: canManageFriend && !friendIsBlocked,
                disabled: true,
                onClick: () => {
                  /* TODO: handleNotifyFriendOnline() */
                },
              },
            ],
          },
          {
            id: 'edit-friend-group',
            label: t('edit-friend-group'),
            show: canManageFriend && !friendIsBlocked,
            onClick: () => handleOpenEditFriend(friendUserId, friendTargetId),
          },
          {
            id: 'set-block',
            label: friendIsBlocked ? t('unblock') : t('block'),
            show: !isCurrentUser,
            onClick: () => handleBlockFriend(friendTargetId, friendIsBlocked),
          },
          {
            id: 'delete-friend',
            label: t('delete-friend'),
            show: !isCurrentUser,
            onClick: () => handleDeleteFriend(friendTargetId),
          },
        ]);
      }}
      onDoubleClick={() => handleOpenDirectMessage(friendUserId, friendTargetId, friendName)}
    >
      <div
        className={styles['avatar-picture']}
        style={{ backgroundImage: `url(${friendAvatarUrl})`, filter: !isFriendOnline ? 'grayscale(100%)' : '' }}
        datatype={isFriendOnline && friendStatus !== 'online' ? friendStatus : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
          <div className={`${styles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>{friendName}</div>
          <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, friendLevel)}`]}`} />
          <BadgeList badges={friendBadges} maxDisplay={5} />
        </div>
        {isFriendOnline && friendCurrentServerId ? (
          <div className={`${styles['box']} ${friendCurrentServerId ? styles['has-server'] : ''}`} onClick={() => handleServerSelect(friendServer)}>
            <div className={styles['location-icon']} />
            <div className={styles['server-name-text']}>{friendServerName}</div>
          </div>
        ) : (
          <div className={styles['signature']}>{friendSignature}</div>
        )}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
