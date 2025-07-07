import React, { useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';

// Components
import FriendTab from '@/components/FriendTab';

interface FriendGroupTabProps {
  user: User;
  friendGroup: FriendGroup;
  friends: UserFriend[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ user, friendGroup, friends, selectedItemId, setSelectedItemId }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const { userId } = user;
    const { friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends = !friendGroupId
      ? friends
          .filter((fd) => !fd.friendGroupId && !fd.isBlocked)
          .sort((a, b) => {
            return (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0);
          })
      : friendGroupId === 'blocked'
      ? friends.filter((friend) => {
          return friend.isBlocked;
        })
      : friends
          .filter((fd) => fd.friendGroupId === friendGroupId && !fd.isBlocked)
          .sort((a, b) => {
            return (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0);
          });
    const friendsOnlineCount = friendGroupFriends.filter((fd) => fd.status !== 'offline').length;
    const canManageFriendGroup = !['', 'blocked', 'outlander'].includes(friendGroupId);

    // Handlers
    const handleDeleteFriendGroup = (friendGroupId: FriendGroup['friendGroupId'], userId: User['userId']) => {
      if (!socket) return;
      handleOpenWarningDialog(t('confirm-delete-friend-group').replace('{0}', friendGroupName), () =>
        socket.send.deleteFriendGroup({ friendGroupId, userId }),
      );
    };

    const handleOpenWarningDialog = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        message: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenEditFriendGroup = (friendGroupId: FriendGroup['friendGroupId'], userId: User['userId']) => {
      ipcService.popup.open(PopupType.EDIT_FRIENDGROUP, 'editFriendGroup');
      ipcService.initialData.onRequest('editFriendGroup', {
        friendGroupId,
        userId,
      });
    };

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={`${styles['tab']} ${selectedItemId === friendGroupId ? styles['selected'] : ''}`}
          onClick={() => {
            setExpanded(!expanded);
            setSelectedItemId(friendGroupId);
          }}
          onContextMenu={(e) => {
            const defaultFriendGroupKeys = new Set(['stranger', 'blacklist']);
            if (defaultFriendGroupKeys.has(friendGroupId)) return;
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'edit-friend-group',
                label: t('edit-friend-group'),
                show: canManageFriendGroup,
                onClick: () => handleOpenEditFriendGroup(friendGroupId, userId),
              },
              {
                id: 'delete-friend-group',
                label: t('delete-friend-group'),
                show: canManageFriendGroup,
                onClick: () => handleDeleteFriendGroup(friendGroupId, userId),
              },
            ]);
          }}
        >
          <div className={`${styles['toggleIcon']} ${expanded ? styles['expanded'] : ''}`} />
          <div className={styles['tabLable']}>{friendGroupName}</div>
          <div className={styles['tabCount']}>
            {friendGroupId !== 'blocked' && friendGroupId !== 'outlander'
              ? `(${friendsOnlineCount}/${friendGroupFriends.length})`
              : `(${friendGroupFriends.length})`}
          </div>
        </div>

        {/* Expanded Sections */}
        <div
          className={styles['tabContent']}
          style={{
            display: expanded ? 'block' : 'none',
          }}
        >
          {friendGroupFriends.map((friend) => (
            <FriendTab
              user={user}
              key={friend.targetId}
              friend={friend}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
            />
          ))}
        </div>
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

export default FriendGroupTab;
