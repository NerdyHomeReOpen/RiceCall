import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { RelationStatus } from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openDirectMessage } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useFriendTabCtxMenu } from '@/hooks/context-menus/useFriendTabCtxMenu';

import BadgeList from '@/components/badge-list';
import LevelIcon from '@/components/level-icon';

import { getDefaultFriendGroup } from '@/utils/default';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

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
  const isPending = friend.relationStatus === RelationStatus.Pending;
  const isFriend = friend.relationStatus === RelationStatus.Friend;
  const displayedServer = isPending ? null : friendCurrentServer;
  const isSignatureVisible = !isPending && !displayedServer;
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
    openDirectMessage(friend.targetId);
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
    <div
      className={`relative flex gap-[5px] items-center justify-start p-[5px] rounded-[3px] ${isSelected ? 'bg-selected' : 'hover:bg-hover'}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onContextMenu={handleTabContextMenu}
    >
      <div
        className="relative w-[40px] h-[40px] before:absolute before:-top-px before:-left-px before:z-1 before:content-[''] before:bg-[url('/win_border.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-cover before:w-[42px] before:h-[42px] after:w-[13px] after:h-[13px] after:absolute after:right-0 after:bottom-0 after:inline-block after:content-[''] after:bg-[url('/user_state.svg')] after:bg-no-repeat after:bg-position-[0_0] [&[datatype='']]:after:bg-none [&[datatype=dnd]]:after:bg-position-[-13px_0] [&[datatype=idle]]:after:bg-position-[-26px_0] [&[datatype=gn]]:after:bg-position-[-39px_0]"
        style={{ filter: isFriend && !isOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        datatype={isFriend && !isOnline && !isOffline && !friend.isBlocked ? friend.status : ''}
      >
        <Image src={friend.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="friend_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-col justify-between h-[40px] overflow-hidden">
        <div className="flex gap-[2px] items-center">
          {hasVip && <div className={`vip-icon vip-${friend.vip}`} />}
          <div className={`truncate font-bold ${hasVip ? 'text-text-vip-name' : ''}`}>
            {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
          </div>
          <LevelIcon level={friend.level} xp={friend.xp} requiredXp={friend.requiredXp} showTooltip={false} />
          <BadgeList badges={JSON.parse(friend.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isPending && <div className="max-w-full min-h-[18px] truncate text-text-color-quaternary select-none">{`(${t('pending')})`}</div>}
        {displayedServer && (
          <div className="flex gap-[2px] items-center cursor-pointer" onClick={handleServerNameClick}>
            <div className="w-[16px] h-[18px] content-[''] bg-[url('/mylocation.svg')] bg-no-repeat bg-center bg-auto" />
            <div className="min-h-[18px] truncate leading-[18px] text-[#3a9abe]">{displayedServer.name}</div>
          </div>
        )}
        {isSignatureVisible && <div className="max-w-full min-h-[18px] truncate text-text-color-quaternary select-none">{friend.signature}</div>}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
