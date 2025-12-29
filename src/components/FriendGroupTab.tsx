import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import FriendTab from '@/components/FriendTab';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/friend.module.css';

interface FriendGroupTabProps {
  friendGroup: Types.FriendGroup;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  searchQuery: string;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friendGroup, selectedItemId, setSelectedItemId, searchQuery }) => {
  // Hooks
  const { showContextMenu } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const friends = useAppSelector((state) => state.friends.data);

  // States
  const [expanded, setExpanded] = useState<boolean>(true);

  // Variables
  const { userId } = user;
  const { friendGroupId, name: friendGroupName } = friendGroup;
  const friendGroupFriends = useMemo(() => {
    switch (friendGroupId) {
      case '':
        return friends.filter((f) => !f.isBlocked && !f.friendGroupId && f.relationStatus !== 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Default
      case 'blacklist':
        return friends.filter((f) => f.isBlocked).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Blacklist
      case 'stranger':
        return friends.filter((f) => !f.isBlocked && f.relationStatus === 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Stranger
      default:
        return friends.filter((f) => !f.isBlocked && f.friendGroupId === friendGroupId && f.relationStatus !== 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Other
    }
  }, [friendGroupId, friends]);
  const filteredFriendGroupFriends = useMemo(() => friendGroupFriends.filter((f) => f.name.includes(searchQuery)), [friendGroupFriends, searchQuery]);
  const friendsOnlineCount = friendGroupFriends.filter((f) => f.status !== 'offline').length;
  const isSelected = selectedItemId === friendGroupId;
  const isStranger = friendGroupId === 'stranger';
  const isBlacklist = friendGroupId === 'blacklist';

  // Handlers
  const getFriendGroupTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addEditFriendGroupNameOption({ friendGroupId }, () => Popup.openEditFriendGroupName(userId, friendGroupId))
      .addDeleteFriendGroupOption({ friendGroupId }, () => Popup.deleteFriendGroup(friendGroupId, friendGroupName))
      .build();

  const handleTabClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getFriendGroupTabContextMenuItems());
  };

  return (
    <div key={friendGroupId}>
      <div className={`${styles['friend-group-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onContextMenu={handleTabContextMenu}>
        <div className={`${styles['toggle-icon']} ${expanded ? styles['expanded'] : ''}`} />
        <div className={styles['tab-label']}>{friendGroupName}</div>
        <div className={styles['tab-count']}>{!isStranger && !isBlacklist ? `(${friendsOnlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}</div>
      </div>
      <div className={styles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {filteredFriendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
