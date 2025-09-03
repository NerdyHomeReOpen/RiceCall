import React, { useRef, useEffect, useState, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, Friend, FriendGroup, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipc from '@/services/ipc.service';
import data from '@/services/data.service';

// Utils
import Default from '@/utils/default';

// Components
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

interface FriendTabProps {
  user: User;
  friend: Friend;
  friendGroups: FriendGroup[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ user, friend, friendGroups, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // Refs
  const refreshed = useRef(false);

  // States
  const [friendServer, setFriendServer] = useState<Server>(Default.server());

  // Destructuring
  const { userId, currentServerId: userCurrentServerId } = user;
  const {
    targetId,
    name: friendName,
    note: friendNote,
    avatarUrl: friendAvatarUrl,
    signature: friendSignature,
    vip: friendVip,
    level: friendLevel,
    xp: friendXp,
    requiredXp: friendRequiredXp,
    badges: friendBadges,
    status: friendStatus,
    relationStatus: friendRelationStatus,
    isBlocked: friendIsBlocked,
    currentServerId: friendCurrentServerId,
  } = friend;
  const { name: friendServerName } = friendServer;

  // Memos
  const isUser = useMemo(() => targetId === userId, [targetId, userId]);
  const isOnline = useMemo(() => friendStatus !== 'offline', [friendStatus]);
  const isStranger = useMemo(() => friendRelationStatus === 0, [friendRelationStatus]);
  const isPending = useMemo(() => friendRelationStatus === 1, [friendRelationStatus]);
  const isFriend = useMemo(() => friendRelationStatus === 2, [friendRelationStatus]);

  // Handlers
  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    if (loadingBox.isLoading) return;
    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);
    ipc.socket.send('connectServer', { serverId });
  };

  const handleBlockUser = (targetId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-block-user', { '0': friendName }), () => ipc.socket.send('blockUser', { targetId }));
  };

  const handleUnblockUser = (targetId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-unblock-user', { '0': friendName }), () => ipc.socket.send('unblockUser', { targetId }));
  };

  const handleDeleteFriend = (targetId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-delete-friend', { '0': friendName }), () => ipc.socket.send('deleteFriend', { targetId }));
  };

  const handleDeleteFriendApplication = (targetId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-delete-friend-application', { '0': friendName }), () => ipc.socket.send('deleteFriendApplication', { receiverId: targetId }));
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenEditFriendNote = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
  };

  const handleEditFriend = (targetId: User['userId'], update: Partial<Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  // Effects
  useEffect(() => {
    if (refreshed.current || !targetId || !friendCurrentServerId) return;
    data.server({ userId: targetId, serverId: friendCurrentServerId }).then((server) => {
      if (server) setFriendServer(server);
    });
    refreshed.current = true;
  }, [friendCurrentServerId, targetId]);

  return (
    <div
      key={targetId}
      className={`${styles['friend-tab']} ${selectedItemId === targetId ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === targetId) setSelectedItemId(null);
        else setSelectedItemId(targetId);
      }}
      onDoubleClick={() => handleOpenDirectMessage(userId, targetId)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isUser,
            onClick: () => handleOpenDirectMessage(userId, targetId),
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
            onClick: () => handleOpenUserInfo(userId, targetId),
          },
          {
            id: 'add-friend',
            label: t('add-friend'),
            show: !isUser && !isFriend,
            onClick: () => handleOpenApplyFriend(userId, targetId),
          },
          {
            id: 'edit-note',
            label: t('edit-note'),
            show: !isUser && isFriend,
            onClick: () => handleOpenEditFriendNote(userId, targetId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'permission-setting',
            label: t('permission-setting'),
            show: !isUser && isFriend,
            icon: 'submenu',
            disabled: true,
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
            id: 'edit-friend-friend-group',
            label: t('edit-friend-friend-group'),
            show: !isUser && !isStranger && !friendIsBlocked,
            icon: 'submenu',
            hasSubmenu: true,
            submenuItems: friendGroups.map((group, key) => ({
              id: `friend-group-${key}`,
              label: group.name,
              show: !((group.friendGroupId || null) === friend.friendGroupId),
              onClick: () => handleEditFriend(targetId, { friendGroupId: group.friendGroupId || null }),
            })),
          },
          {
            id: 'block',
            label: friendIsBlocked ? t('unblock') : t('block'),
            show: !isUser,
            onClick: () => (friendIsBlocked ? handleUnblockUser(targetId) : handleBlockUser(targetId)),
          },
          {
            id: 'delete-friend',
            label: t('delete-friend'),
            show: !isUser && isFriend,
            onClick: () => handleDeleteFriend(targetId),
          },
          {
            id: 'delete-friend-application',
            label: t('delete-friend-application'),
            show: !isUser && isPending,
            onClick: () => handleDeleteFriendApplication(targetId),
          },
        ]);
      }}
    >
      <div
        className={styles['avatar-picture']}
        style={{ backgroundImage: `url(${friendAvatarUrl})`, filter: isOnline && isFriend ? '' : 'grayscale(100%)' }}
        datatype={isOnline && isFriend ? friendStatus : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
          <div className={`${styles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>
            {friendNote || friendName} {friendNote !== '' ? `(${friendName})` : ''}
          </div>
          <LevelIcon level={friendLevel} xp={friendXp} requiredXp={friendRequiredXp} />
          <BadgeList badges={JSON.parse(friendBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['signature']}>{`(${t('pending')})`}</div>
        ) : isFriend && isOnline && friendCurrentServerId ? (
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
