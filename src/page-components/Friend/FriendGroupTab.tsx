import React, { useState } from 'react';

import * as Types from '@/types';

import * as Store from '@/store';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useFriendGroupCtxMenu } from '@/hooks/ContextMenus/useFriendGroupCtxMenu';

import FriendTab from './FriendTab';

import styles from './Friend.module.css';

interface FriendGroupTabProps {
  friendGroup: Types.FriendGroup;
  friends: Types.Friend[];
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friendGroup, friends }) => {
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-group-${friendGroup.friendGroupId}`);

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const friendGroupFriends = friends.filter((f) => {
    if (friendGroup.friendGroupId === 'default') {
      return !f.isBlocked && !f.friendGroupId && f.relationStatus !== 0;
    } else if (friendGroup.friendGroupId === 'blacklist') {
      return f.isBlocked;
    } else if (friendGroup.friendGroupId === 'stranger') {
      return !f.isBlocked && f.relationStatus === 0;
    } else {
      return !f.isBlocked && f.friendGroupId === friendGroup.friendGroupId && f.relationStatus !== 0;
    }
  });
  const sortedFriendGroupFriends = [...friendGroupFriends].sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0));
  const isStranger = friendGroup.friendGroupId === 'stranger';
  const isBlacklist = friendGroup.friendGroupId === 'blacklist';
  const onlineCount = friendGroupFriends.filter((f) => f.status !== 'offline').length;

  const { buildContextMenu: buildFriendGroupContextMenu } = useFriendGroupCtxMenu({ userId, friendGroupId: friendGroup.friendGroupId, friendGroupName: friendGroup.name });

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
      <div className={`${styles['friend-group-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onContextMenu={handleTabContextMenu}>
        <div className={`${styles['toggle-icon']} ${isExpanded ? styles['expanded'] : ''}`} />
        <div className={styles['label']}>{friendGroup.name}</div>
        <div className={styles['friend-count-text']}>{!isStranger && !isBlacklist ? `(${onlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}</div>
      </div>
      <div className={styles['friend-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedFriendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
