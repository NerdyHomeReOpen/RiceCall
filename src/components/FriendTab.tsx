import React, { useRef, useEffect, useState, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, Friend, Server } from '@/types';

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
  friend: Friend;
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

  // Memos
  const isUser = useMemo(() => {
    return friendUserId === user.userId;
  }, [friendUserId, user.userId]);

  // Handlers
  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    if (loadingBox.isLoading) return;

    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);
    ipcService.socket.send('connectServer', { serverId });
  };

  const handleBlockFriend = (targetId: User['userId'], isBlocked: Friend['isBlocked']) => {
    handleOpenAlertDialog(t(`confirm-${isBlocked ? 'unblock' : 'block'}-friend`, { '0': friendName }), () => ipcService.socket.send('editFriend', { targetId, update: { isBlocked: !isBlocked } }));
  };

  const handleDeleteFriend = (targetId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-delete-friend', { '0': friendName }), () => ipcService.socket.send('deleteFriend', { targetId }));
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenEditFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('editFriend', 'editFriend', { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message: message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
  };

  useEffect(() => {
    if (!friendCurrentServerId) return;
    const refresh = async () => {
      getService.server({ userId: friendUserId, serverId: friendCurrentServerId }).then((server) => {
        if (server) setFriendServer(server);
      });
      refreshed.current = true;
    };
    refresh();
  }, [friendCurrentServerId, friendUserId]);

  return (
    <div
      key={friendTargetId}
      className={`${styles['friend-tab']} ${selectedItemId === `${friendTargetId}` ? styles['selected'] : ''}`}
      onClick={() => setSelectedItemId(friendTargetId)}
      onDoubleClick={() => handleOpenDirectMessage(friendUserId, friendTargetId, friendName)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isUser,
            onClick: () => handleOpenDirectMessage(friendUserId, friendTargetId, friendName),
          },
          {
            id: 'separator',
            label: '',
            show: !isUser,
          },
          {
            id: 'view-profile',
            label: t('view-profile'),
            show: !isUser,
            onClick: () => handleOpenUserInfo(friendUserId, friendTargetId),
          },
          {
            id: 'edit-note',
            label: t('edit-note'),
            show: !isUser && !friendIsBlocked,
            disabled: true,
            onClick: () => {
              /* TODO: handleFriendNote() */
            },
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'permission-setting',
            label: t('permission-setting'),
            show: !isUser && !friendIsBlocked,
            icon: 'submenu',
            hasSubmenu: true,
            submenuItems: [
              {
                id: 'set-hide-or-show-online-to-friend',
                label: t('hide-online-to-friend'),
                disabled: true,
                onClick: () => {
                  /* TODO: handlePrivateFriend() */
                },
              },
              {
                id: 'set-notify-friend-online',
                label: t('notify-friend-online'),
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
            show: !isUser && !friendIsBlocked,
            onClick: () => handleOpenEditFriend(friendUserId, friendTargetId),
          },
          {
            id: 'set-block',
            label: friendIsBlocked ? t('unblock') : t('block'),
            show: !isUser,
            onClick: () => handleBlockFriend(friendTargetId, friendIsBlocked),
          },
          {
            id: 'delete-friend',
            label: t('delete-friend'),
            show: !isUser,
            onClick: () => handleDeleteFriend(friendTargetId),
          },
        ]);
      }}
    >
      <div
        className={styles['avatar-picture']}
        style={{ backgroundImage: `url(${friendAvatarUrl})`, filter: friendStatus === 'offline' ? 'grayscale(100%)' : '' }}
        datatype={friendStatus !== 'online' ? friendStatus : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
          <div className={`${styles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>{friendName}</div>
          <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, friendLevel)}`]}`} />
          <BadgeList badges={JSON.parse(friendBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {friendStatus !== 'offline' && friendCurrentServerId ? (
          <div className={`${styles['box']} ${friendCurrentServerId ? styles['has-server'] : ''}`} onClick={() => handleServerSelect(friendCurrentServerId, friendServer.displayId)}>
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
