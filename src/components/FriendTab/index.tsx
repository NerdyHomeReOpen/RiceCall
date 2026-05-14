import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openDirectMessage } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useFriendTabCtxMenu } from '@/hooks/ContextMenus/useFriendTabCtxMenu';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

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

  const { buildContextMenu: buildFriendTabContextMenu } = useFriendTabCtxMenu({ user, friend, friendGroups, defaultFriendGroup });

  const handleServerNameClick = () => {
    if (getIsLoading() || !friendCurrentServer || user.currentServerId === friendCurrentServer.serverId) return;
    loadServer(friendCurrentServer.specialId || friendCurrentServer.displayId);
    ipc.socket.send('connectServer', { serverId: friendCurrentServer.serverId });
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`friend-${friend.targetId}`));
  };

  const handleTabDoubleClick = () => {
    openDirectMessage(user.userId, friend.targetId);
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
    ipc.api.fetchServer({ userId: friend.targetId, serverId: friend.currentServerId }).then((server) => {
      if (server) setFriendCurrentServer(server);
    });
  }, [friend.targetId, friend.isBlocked, friend.shareCurrentServer, friend.currentServerId, isFriend]);

  return (
    <div className={`${styles['item']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onDoubleClick={handleTabDoubleClick} onContextMenu={handleTabContextMenu}>
      <div
        className={styles['avatar']}
        style={{ filter: isFriend && !isOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        datatype={isFriend && !isOnline && !isOffline && !friend.isBlocked ? friend.status : ''}
      >
        <Image src={friend.avatarUrl} alt="friend_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['base-info']}>
        <div className={styles['detail-row']}>
          {hasVip && <div className={`vip-icon vip-${friend.vip}`} />}
          <div className={`${styles['name-text']} ${hasVip ? styles['vip'] : ''}`}>
            {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
          </div>
          <LevelIcon level={friend.level} xp={friend.xp} requiredXp={friend.requiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friend.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending ? (
          <div className={styles['signature-text']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['detail-row']} ${styles['has-server']}`} onClick={handleServerNameClick}>
            <div className={styles['location-icon']} />
            <div className={styles['server-name-text']}>{friendCurrentServer.name}</div>
          </div>
        ) : (
          <div className={styles['signature-text']}>{friend.signature}</div>
        )}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
