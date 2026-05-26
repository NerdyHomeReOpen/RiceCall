import React, { useState } from 'react';

import * as Types from '@/types';

import * as Store from '@/store';

import { openEditFriendGroupName, deleteFriendGroup } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import FriendTab from './FriendTab';

import ContextMenu from '@/utils/contextMenu';

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
  const friendGroupIsStrangerTab = friendGroup.friendGroupId === 'stranger';
  const friendGroupIsBlacklistTab = friendGroup.friendGroupId === 'blacklist';
  const onlineCount = friendGroupFriends.filter((f) => f.status !== 'offline').length;

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`friend-group-${friendGroup.friendGroupId}`));
    }

    setIsExpanded((prev) => !prev);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addEditFriendGroupNameOption({ friendGroupId: friendGroup.friendGroupId }, () => openEditFriendGroupName(userId, friendGroup.friendGroupId))
      .addDeleteFriendGroupOption({ friendGroupId: friendGroup.friendGroupId }, () => deleteFriendGroup(friendGroup.friendGroupId, friendGroup.name))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  return (
    <>
      <div className={`${styles['friend-group-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onContextMenu={handleTabContextMenu}>
        <div className={`${styles['toggle-icon']} ${isExpanded ? styles['expanded'] : ''}`} />
        <div className={styles['label']}>{friendGroup.name}</div>
        <div className={styles['friend-count-text']}>
          {!friendGroupIsStrangerTab && !friendGroupIsBlacklistTab ? `(${onlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}
        </div>
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
