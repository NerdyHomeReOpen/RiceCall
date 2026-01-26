import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/friend.module.css';
import vip from '@/styles/vip.module.css';

interface FriendTabProps {
  friend: Types.Friend;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-${friend.targetId}`, shallowEqual);

  // States
  const [friendCurrentServer, setFriendCurrentServer] = useState<Types.Server | null>(null);

  // Variables
  const defaultFriendGroup = useMemo(() => Default.friendGroup({ name: t('my-friends'), order: -1, userId: user.userId }), [t, user.userId]);
  const isSelf = friend.targetId === user.userId;
  const isOnline = friend.status === 'online';
  const isOffline = friend.status === 'offline';
  const isStranger = friend.relationStatus === 0;
  const isPending = friend.relationStatus === 1;
  const isFriend = friend.relationStatus === 2;
  const hasVip = friend.vip > 0;
  const hasNote = friend.note !== '' && friend.note !== null;

  // Functions
  const getFriendTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, friend.targetId))
      .addViewProfileOption(() => Popup.openUserInfo(user.userId, friend.targetId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(user.userId, friend.targetId))
      .addEditNoteOption({ isSelf, isFriend }, () => Popup.openEditFriendNote(user.userId, friend.targetId))
      .addSeparator()
      .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {})
      .addEditFriendFriendGroupOption(
        { isSelf, isStranger, isBlocked: friend.isBlocked },
        () => {},
        new CtxMenuBuilder()
          .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) => Popup.editFriend(friend.targetId, { friendGroupId }))
          .build(),
      )
      .addBlockUserOption({ isSelf, isBlocked: friend.isBlocked }, () => (friend.isBlocked ? Popup.unblockUser(friend.targetId, friend.name) : Popup.blockUser(friend.targetId, friend.name)))
      .addDeleteFriendOption({ isSelf, isFriend }, () => Popup.deleteFriend(friend.targetId, friend.name))
      .addDeleteFriendApplicationOption({ isSelf, isPending }, () => Popup.deleteFriendApplication(friend.targetId))
      .build();

  // Handlers
  const handleServerNameClick = () => {
    if (getIsLoading() || !friendCurrentServer || user.currentServerId === friendCurrentServer.serverId) return;
    loadServer(friendCurrentServer.specialId || friendCurrentServer.displayId);
    ipc.socket.send('connectServer', { serverId: friendCurrentServer.serverId });
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`friend-${friend.targetId}`));
  };

  const handleTabDoubleClick = () => {
    Popup.openDirectMessage(user.userId, friend.targetId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getFriendTabContextMenuItems());
  };

  // Effects
  useEffect(() => {
    if (!friend.targetId || friend.isBlocked || !friend.shareCurrentServer || !friend.currentServerId || !isFriend) {
      setFriendCurrentServer(null);
      return;
    }
    ipc.data.server({ userId: friend.targetId, serverId: friend.currentServerId }).then((server) => {
      if (server) setFriendCurrentServer(server);
    });
  }, [friend.targetId, friend.isBlocked, friend.shareCurrentServer, friend.currentServerId, isFriend]);

  return (
    <div className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onDoubleClick={handleTabDoubleClick} onContextMenu={handleTabContextMenu}>
      <Image
        className={styles['avatar-picture']}
        style={{ filter: isFriend && !isOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        src={friend.avatarUrl}
        alt={friend.name}
        width={40}
        height={40}
        loading="lazy"
        draggable="false"
        datatype={isFriend && !isOnline && !isOffline && !friend.isBlocked ? friend.status : ''}
      />
      <div className={styles['base-info-wrapper']}>
        <div className={styles['box']}>
          {hasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${friend.vip}`]}`} />}
          <div className={`${styles['name-text']} ${hasVip ? vip['vip-name-color'] : ''}`}>
            {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
          </div>
          <LevelIcon level={friend.level} xp={friend.xp} requiredXp={friend.requiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friend.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['signature']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['box']} ${styles['has-server']}`} onClick={handleServerNameClick}>
            <div className={styles['location-icon']} />
            <div className={styles['server-name-text']}>{friendCurrentServer.name}</div>
          </div>
        ) : (
          <div className={styles['signature']}>{friend.signature}</div>
        )}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
