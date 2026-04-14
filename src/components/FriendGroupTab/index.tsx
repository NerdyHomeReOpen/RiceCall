import React, { useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useFriendGroupContextMenu } from '@/hooks/ContextMenus/FriendGroup';

import FriendTab from '@/components/FriendTab';

import styles from './FriendGroupTab.module.css';

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
      return friends.filter((f) => !f.isBlocked && !f.friendGroupId && f.relationStatus !== 0);
    } else if (friendGroup.friendGroupId === 'blacklist') {
      return friends.filter((f) => f.isBlocked);
    } else if (friendGroup.friendGroupId === 'stranger') {
      return friends.filter((f) => !f.isBlocked && f.relationStatus === 0);
    } else {
      return friends.filter((f) => !f.isBlocked && f.friendGroupId === friendGroup.friendGroupId && f.relationStatus !== 0);
    }
  }, [friendGroup.friendGroupId, friends]);
  const sortedFriendGroupFriends = useMemo(() => [...friendGroupFriends].sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)), [friendGroupFriends]);
  const onlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);

  const { buildContextMenu: buildFriendGroupContextMenu } = useFriendGroupContextMenu({ user, friendGroup });

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
        <div className={`${styles['friend-group-tab-toggle-icon']} ${isExpanded ? styles['expanded'] : ''}`} />
        <div className={styles['friend-group-tab-label']}>{friendGroup.name}</div>
        <div className={styles['friend-group-tab-count']}>{!isStranger && !isBlacklist ? `(${onlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}</div>
      </div>
      <div className={styles['friend-group-tab-content']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedFriendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
