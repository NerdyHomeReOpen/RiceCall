import React, { useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';

import FriendTab from '@/components/FriendTab';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/friend.module.css';

interface FriendGroupTabProps {
  friendGroup: Types.FriendGroup;
  friends: Types.Friend[];
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friendGroup, friends }) => {
  // Hooks
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-group-${friendGroup.friendGroupId}`, shallowEqual);

  // States
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Variables
  const isStranger = friendGroup.friendGroupId === 'stranger';
  const isBlacklist = friendGroup.friendGroupId === 'blacklist';
  const friendGroupFriends = useMemo(() => {
    if (friendGroup.friendGroupId === 'default') {
      return friends.filter((f) => !f.isBlocked && !f.friendGroupId && f.relationStatus !== 0); // Default
    } else if (friendGroup.friendGroupId === 'blacklist') {
      return friends.filter((f) => f.isBlocked); // Blacklist
    } else if (friendGroup.friendGroupId === 'stranger') {
      return friends.filter((f) => !f.isBlocked && f.relationStatus === 0); // Stranger
    } else {
      return friends.filter((f) => !f.isBlocked && f.friendGroupId === friendGroup.friendGroupId && f.relationStatus !== 0); // Other
    }
  }, [friendGroup.friendGroupId, friends]);
  const sortedFriendGroupFriends = useMemo(() => [...friendGroupFriends].sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)), [friendGroupFriends]);
  const onlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);

  // Functions
  const getFriendGroupTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addEditFriendGroupNameOption({ friendGroupId: friendGroup.friendGroupId }, () => Popup.openEditFriendGroupName(user.userId, friendGroup.friendGroupId))
      .addDeleteFriendGroupOption({ friendGroupId: friendGroup.friendGroupId }, () => Popup.deleteFriendGroup(friendGroup.friendGroupId, friendGroup.name))
      .build();

  // Handlers
  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`friend-group-${friendGroup.friendGroupId}`));
    setIsExpanded((prev) => !prev);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getFriendGroupTabContextMenuItems());
  };

  return (
    <>
      <div className={`${styles['friend-group-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onContextMenu={handleTabContextMenu}>
        <div className={`${styles['toggle-icon']} ${isExpanded ? styles['expanded'] : ''}`} />
        <div className={styles['tab-label']}>{friendGroup.name}</div>
        <div className={styles['tab-count']}>{!isStranger && !isBlacklist ? `(${onlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}</div>
      </div>
      <div className={styles['tab-content']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedFriendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
