import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useFriendTabContextMenu } from '@/hooks/ContextMenus/FriendTab';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { setSelectedItemId } from '@/store/slices/UI';

import { getDefaultFriendGroup } from '@/utils/default';

import styles from './FriendTab.module.css';

interface FriendTabProps {
  friend: Types.Friend;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-${friend.targetId}`, shallowEqual);

  const [friendCurrentServer, setFriendCurrentServer] = useState<Types.Server | null>(null);

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ name: t('my-friends'), order: -1, userId: user.userId }), [t, user.userId]);
  const isOnline = friend.status === 'online';
  const isOffline = friend.status === 'offline';
  const isPending = friend.relationStatus === 1;
  const isFriend = friend.relationStatus === 2;
  const hasVip = friend.vip > 0;
  const hasNote = friend.note !== '' && friend.note !== null;

  const { buildContextMenu: buildFriendTabContextMenu } = useFriendTabContextMenu({ user, friend, friendGroups, defaultFriendGroup });

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
    Actions.openDirectMessage(user.userId, friend.targetId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildFriendTabContextMenu());
  };

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
        className={styles['friend-tab-avatar-picture']}
        style={{ filter: isFriend && !isOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        src={friend.avatarUrl}
        alt={friend.name}
        width={40}
        height={40}
        loading="lazy"
        draggable="false"
        datatype={isFriend && !isOnline && !isOffline && !friend.isBlocked ? friend.status : ''}
      />
      <div className={styles['friend-tab-base-info']}>
        <div className={styles['friend-tab-box']}>
          {hasVip && <div className={`vip-icon vip-${friend.vip}`} />}
          <div className={`${styles['friend-tab-name-text']} ${hasVip ? styles['vip'] : ''}`}>
            {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
          </div>
          <LevelIcon level={friend.level} xp={friend.xp} requiredXp={friend.requiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friend.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['friend-tab-signature-text']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['friend-tab-box']} ${styles['has-server']}`} onClick={handleServerNameClick}>
            <div className={styles['friend-tab-location-icon']} />
            <div className={styles['friend-tab-server-name-text']}>{friendCurrentServer.name}</div>
          </div>
        ) : (
          <div className={styles['friend-tab-signature-text']}>{friend.signature}</div>
        )}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
