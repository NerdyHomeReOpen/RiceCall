import React, { useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';
import { RelationStatus } from '@/types';

import * as Store from '@/store';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useFriendGroupCtxMenu } from '@/hooks/context-menus/useFriendGroupCtxMenu';

import FriendTab from './FriendTab';

interface FriendGroupTabProps {
  friendGroup: Types.FriendGroup;
  friends: Types.Friend[];
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friendGroup, friends }) => {
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-group-${friendGroup.friendGroupId}`, shallowEqual);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isStranger = friendGroup.friendGroupId === 'stranger';
  const isBlacklist = friendGroup.friendGroupId === 'blacklist';

  const friendGroupFriends = useMemo(() => {
    if (friendGroup.friendGroupId === 'default') {
      return friends.filter((f) => !f.isBlocked && !f.friendGroupId && f.relationStatus !== RelationStatus.Stranger);
    } else if (friendGroup.friendGroupId === 'blacklist') {
      return friends.filter((f) => f.isBlocked);
    } else if (friendGroup.friendGroupId === 'stranger') {
      return friends.filter((f) => !f.isBlocked && f.relationStatus === RelationStatus.Stranger);
    } else {
      return friends.filter((f) => !f.isBlocked && f.friendGroupId === friendGroup.friendGroupId && f.relationStatus !== RelationStatus.Stranger);
    }
  }, [friendGroup.friendGroupId, friends]);

  const sortedFriendGroupFriends = useMemo(() => [...friendGroupFriends].sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)), [friendGroupFriends]);
  const onlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);
  const { buildContextMenu: buildFriendGroupContextMenu } = useFriendGroupCtxMenu({ user, friendGroup });

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`friend-group-${friendGroup.friendGroupId}`));

    setIsExpanded((prev) => !prev);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildFriendGroupContextMenu());
  };

  return (
    <>
      <div className={`flex gap-[2px] items-center h-[25px] p-[5px] rounded-[3px] hover:bg-hover ${isSelected ? 'bg-selected' : ''}`} onClick={handleTabClick} onContextMenu={handleTabContextMenu}>
        <div
          className={`inline-block min-w-[14px] min-h-[14px] content-[''] bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${isExpanded ? 'bg-position-[-14px_0]' : 'bg-position-[0_0]'}`}
        />
        <div className="truncate text-text-color-secondary">{friendGroup.name}</div>
        <div className="text-[#808080]">{!isStranger && !isBlacklist ? `(${onlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}</div>
      </div>
      <div className="ml-[20px]" style={isExpanded ? {} : { display: 'none' }}>
        {sortedFriendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
