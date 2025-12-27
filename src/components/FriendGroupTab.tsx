import React, { useState, useMemo } from 'react';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import FriendTab from '@/components/FriendTab';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/friend.module.css';

interface FriendGroupTabProps {
  user: Types.User;
  friends: Types.Friend[];
  friendGroup: Types.FriendGroup;
  friendGroups: Types.FriendGroup[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ user, friendGroup, friends, friendGroups, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const contextMenu = useContextMenu();

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
  const friendsOnlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);

  // Handlers
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addEditFriendGroupNameOption({ friendGroupId }, () => Popup.openEditFriendGroupName(userId, friendGroupId))
      .addDeleteFriendGroupOption({ friendGroupId }, () => Popup.deleteFriendGroup(friendGroupId, friendGroupName))
      .build();

  return (
    <div key={friendGroupId}>
      <div
        className={`${styles['friend-group-tab']} ${selectedItemId === friendGroupId ? styles['selected'] : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
        onContextMenu={(e) => {
          e.preventDefault();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
        }}
      >
        <div className={`${styles['toggle-icon']} ${expanded ? styles['expanded'] : ''}`} />
        <div className={styles['tab-label']}>{friendGroupName}</div>
        <div className={styles['tab-count']}>
          {friendGroupId !== 'blacklist' && friendGroupId !== 'stranger' ? `(${friendsOnlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}
        </div>
      </div>
      <div className={styles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab user={user} key={friend.targetId} friend={friend} friendGroups={friendGroups} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
