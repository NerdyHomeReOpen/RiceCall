import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

import * as Popup from '@/utils/popup';

import styles from '@/styles/friend.module.css';
import vip from '@/styles/vip.module.css';

interface FriendTabProps {
  user: Types.User;
  friend: Types.Friend;
  friendGroups: Types.FriendGroup[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ user, friend, friendGroups, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // States
  const [friendCurrentServer, setFriendCurrentServer] = useState<Types.Server | null>(null);

  // Variables
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
    isBlocked: isFriendBlocked,
    currentServerId: friendCurrentServerId,
    shareCurrentServer: friendShareCurrentServer,
  } = friend;
  const isUser = targetId === userId;
  const isOnline = friendStatus !== 'offline';
  const isStranger = friendRelationStatus === 0;
  const isPending = friendRelationStatus === 1;
  const isFriend = friendRelationStatus === 2;

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'direct-message',
      label: t('direct-message'),
      show: !isUser,
      onClick: () => Popup.handleOpenDirectMessage(userId, targetId),
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
      onClick: () => Popup.handleOpenUserInfo(userId, targetId),
    },
    {
      id: 'add-friend',
      label: t('add-friend'),
      show: !isUser && !isFriend,
      onClick: () => Popup.handleOpenApplyFriend(userId, targetId),
    },
    {
      id: 'edit-note',
      label: t('edit-note'),
      show: !isUser && isFriend,
      onClick: () => Popup.handleOpenEditFriendNote(userId, targetId),
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
      show: !isUser && !isStranger && !isFriendBlocked,
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
      label: isFriendBlocked ? t('unblock') : t('block'),
      show: !isUser,
      onClick: () => (isFriendBlocked ? handleUnblockUser(targetId) : handleBlockUser(targetId)),
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
  ];

  const handleServerSelect = (server: Types.Server) => {
    if (loadingBox.isLoading) return;
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const handleBlockUser = (targetId: Types.User['userId']) => {
    Popup.handleOpenAlertDialog(t('confirm-block-user', { '0': friendName }), () => ipc.socket.send('blockUser', { targetId }));
  };

  const handleUnblockUser = (targetId: Types.User['userId']) => {
    Popup.handleOpenAlertDialog(t('confirm-unblock-user', { '0': friendName }), () => ipc.socket.send('unblockUser', { targetId }));
  };

  const handleDeleteFriend = (targetId: Types.User['userId']) => {
    Popup.handleOpenAlertDialog(t('confirm-delete-friend', { '0': friendName }), () => ipc.socket.send('deleteFriend', { targetId }));
  };

  const handleDeleteFriendApplication = (targetId: Types.User['userId']) => {
    Popup.handleOpenAlertDialog(t('confirm-delete-friend-application', { '0': friendName }), () => ipc.socket.send('deleteFriendApplication', { receiverId: targetId }));
  };

  const handleEditFriend = (targetId: Types.User['userId'], update: Partial<Types.Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
  };

  // Effects
  useEffect(() => {
    if (!targetId || !friendCurrentServerId || isFriendBlocked || !isFriend || !friendShareCurrentServer) {
      setFriendCurrentServer(null);
      return;
    }
    ipc.data.server({ userId: targetId, serverId: friendCurrentServerId }).then((server) => {
      if (server) setFriendCurrentServer(server);
    });
  }, [targetId, friendCurrentServerId, isFriendBlocked, isFriend, friendShareCurrentServer]);

  return (
    <div
      key={targetId}
      className={`${styles['friend-tab']} ${selectedItemId === targetId ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === targetId) setSelectedItemId(null);
        else setSelectedItemId(targetId);
      }}
      onDoubleClick={() => Popup.handleOpenDirectMessage(userId, targetId)}
      onContextMenu={(e) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div
        className={styles['avatar-picture']}
        style={{ backgroundImage: `url(${friendAvatarUrl})`, filter: isOnline && isFriend && !isFriendBlocked ? '' : 'grayscale(100%)' }}
        datatype={isOnline && isFriend && !isFriendBlocked && friendStatus !== 'online' /* filter online status icon */ ? friendStatus : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
          <div className={`${styles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>
            {friendNote || friendName} {friendNote !== '' ? `(${friendName})` : ''}
          </div>
          <LevelIcon level={friendLevel} xp={friendXp} requiredXp={friendRequiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friendBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['signature']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['box']} ${styles['has-server']}`} onClick={() => handleServerSelect(friendCurrentServer)}>
            <div className={styles['location-icon']} />
            <div className={styles['server-name-text']}>{friendCurrentServer.name}</div>
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
