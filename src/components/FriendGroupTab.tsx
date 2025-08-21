import React, { useState, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import type { User, FriendGroup, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Components
import FriendTab from '@/components/FriendTab';

interface FriendGroupTabProps {
  user: User;
  friends: Friend[];
  friendGroup: FriendGroup;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ user, friendGroup, friends, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // States
  const [expanded, setExpanded] = useState<boolean>(true);

  // Destructuring
  const { userId } = user;
  const { friendGroupId, name: friendGroupName } = friendGroup;

  // Memos
  const friendGroupFriends = useMemo(() => {
    return !friendGroupId
      ? friends.filter((f) => !f.friendGroupId && !f.isBlocked).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)) // Default
      : friendGroupId === 'blacklist'
        ? friends.filter((f) => f.isBlocked) // Blacklist
        : friends.filter((f) => f.friendGroupId === friendGroupId && !f.isBlocked).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Other
  }, [friendGroupId, friends]);
  const friendsOnlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);

  // Handlers
  const handleDeleteFriendGroup = (friendGroupId: FriendGroup['friendGroupId']) => {
    handleOpenAlertDialog(t('confirm-delete-friend-group', { '0': friendGroupName }), () => ipc.socket.send('deleteFriendGroup', { friendGroupId }));
  };

  const handleOpenEditFriendGroupName = (userId: User['userId'], friendGroupId: FriendGroup['friendGroupId']) => {
    ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  return (
    <div key={friendGroupId}>
      {/* Tab View */}
      <div
        className={`${styles['friend-group-tab']} ${selectedItemId === friendGroupId ? styles['selected'] : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
        onContextMenu={(e) => {
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'edit-friend-group-name',
              label: t('edit-friend-group-name'),
              show: !['', 'blacklist', 'stranger'].includes(friendGroupId),
              onClick: () => handleOpenEditFriendGroupName(userId, friendGroupId),
            },
            {
              id: 'delete-friend-group',
              label: t('delete-friend-group'),
              show: !['', 'blacklist', 'stranger'].includes(friendGroupId),
              onClick: () => handleDeleteFriendGroup(friendGroupId),
            },
          ]);
        }}
      >
        <div className={`${styles['toggle-icon']} ${expanded ? styles['expanded'] : ''}`} />
        <div className={styles['tab-label']}>{friendGroupName}</div>
        <div className={styles['tab-count']}>
          {friendGroupId !== 'blocked' && friendGroupId !== 'outlander' ? `(${friendsOnlineCount}/${friendGroupFriends.length})` : `(${friendGroupFriends.length})`}
        </div>
      </div>

      {/* Expanded Sections */}
      <div className={styles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab user={user} key={friend.targetId} friend={friend} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
