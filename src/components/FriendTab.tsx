import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/friend.module.css';
import vip from '@/styles/vip.module.css';

interface FriendTabProps {
  friend: Types.Friend;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { selectTab } = useMainTab();
  const { isLoading, loadServer } = useLoading();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const friendGroups = useAppSelector((state) => state.friendGroups.data);

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
  const isOffline = friendStatus === 'offline';
  const isOnline = !isOffline;
  const isStranger = friendRelationStatus === 0;
  const isPending = friendRelationStatus === 1;
  const isFriend = friendRelationStatus === 2;
  const isSelected = selectedItemId === targetId;
  const friendHasVip = friendVip > 0;
  const friendHasNote = friendNote !== '' && friendNote !== null;
  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: -1, userId });

  // Functions
  const getFriendTabContextMenuItems = () =>
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
          .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) => Popup.editFriend(targetId, { friendGroupId }))
          .build(),
      )
      .addBlockUserOption({ isSelf, isBlocked: isFriendBlocked }, () => (isFriendBlocked ? Popup.unblockUser(targetId, friendName) : Popup.blockUser(targetId, friendName)))
      .addDeleteFriendOption({ isSelf, isFriend }, () => Popup.deleteFriend(targetId, friendName))
      .addDeleteFriendApplicationOption({ isSelf, isPending }, () => Popup.deleteFriendApplication(targetId))
      .build();

  // Handlers
  const handleServerNameClick = () => {
    if (isLoading || !friendCurrentServer) return;
    if (friendCurrentServer.serverId === userCurrentServerId) {
      selectTab('server');
      return;
    }
    loadServer(friendCurrentServer.specialId || friendCurrentServer.displayId);
    ipc.socket.send('connectServer', { serverId: friendCurrentServer.serverId });
  };

  const handleTabClick = () => {
    if (isSelected) setSelectedItemId(null);
    else setSelectedItemId(targetId);
  };

  const handleTabDoubleClick = () => {
    Popup.openDirectMessage(userId, targetId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getFriendTabContextMenuItems());
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
      className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onContextMenu={handleTabContextMenu}
    >
      <Image
        className={styles['avatar-picture']}
        style={{ filter: isFriend && isOnline && !isFriendBlocked ? '' : 'grayscale(100%)' }}
        src={friendAvatarUrl}
        alt={friendName}
        width={40}
        height={40}
        loading="lazy"
        draggable="false"
        datatype={isFriend && !isOnline && !isOffline && !isFriendBlocked ? friendStatus : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {friendHasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
          <div className={`${styles['name-text']} ${friendHasVip ? vip['vip-name-color'] : ''}`}>
            {friendNote || friendName} {friendHasNote ? `(${friendName})` : ''}
          </div>
          <LevelIcon level={friendLevel} xp={friendXp} requiredXp={friendRequiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friendBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['signature']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['box']} ${styles['has-server']}`} onClick={handleServerNameClick}>
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
