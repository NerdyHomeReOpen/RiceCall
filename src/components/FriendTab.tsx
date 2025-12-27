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
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

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
  const isSelf = targetId === userId;
  const isOnline = friendStatus !== 'offline';
  const isStranger = friendRelationStatus === 0;
  const isPending = friendRelationStatus === 1;
  const isFriend = friendRelationStatus === 2;

  // Handlers
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, targetId))
      .addViewProfileOption(() => Popup.openUserInfo(userId, targetId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(userId, targetId))
      .addEditNoteOption({ isSelf, isFriend }, () => Popup.openEditFriendNote(userId, targetId))
      .addSeparator()
      .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {})
      .addEditFriendFriendGroupOption(
        { isSelf, isStranger, isBlocked: isFriendBlocked },
        () => {},
        new CtxMenuBuilder()
          .addFriendGroupOption({ friendGroupId: friend.friendGroupId || '', friendGroups: friendGroups }, (friendGroupId) => Popup.editFriend(targetId, { friendGroupId: friendGroupId || null }))
          .build(),
      )
      .addBlockUserOption({ isSelf, isBlocked: isFriendBlocked }, () => (isFriendBlocked ? Popup.unblockUser(targetId, friendName) : Popup.blockUser(targetId, friendName)))
      .addDeleteFriendOption({ isSelf, isFriend }, () => Popup.deleteFriend(targetId, friendName))
      .addDeleteFriendApplicationOption({ isSelf, isPending }, () => Popup.deleteFriendApplication(targetId))
      .build();

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
      onDoubleClick={() => Popup.openDirectMessage(userId, targetId)}
      onContextMenu={(e) => {
        e.preventDefault();
        const { clientX: x, clientY: y } = e;
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
