import React, { useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend } from '@/types';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';
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
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const { userId } = user;
    const { friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends =
      friendGroupId === ''
        ? friends
            .filter((fd) => !fd.friendGroupId)
            .sort((a, b) => {
              return (b.online ? 1 : 0) - (a.online ? 1 : 0);
            })
        : friendGroupId === 'blocked'
        ? friends.filter((friend) => {
            return friend.isBlocked;
          })
        : friends
            .filter((fd) => fd.friendGroupId === friendGroupId)
            .sort((a, b) => {
              return (b.online ? 1 : 0) - (a.online ? 1 : 0);
            });
    const friendsOnlineCount = friendGroupFriends.filter(
      (fd) => fd.online ?? fd.currentServerId,
    ).length;
    const canManageFriendGroup = friendGroupId !== '';

    // Handlers
    const handleDeleteFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.deleteFriendGroupDialog.replace('{0}', friendGroupName),
        () => socket.send.deleteFriendGroup({ friendGroupId, userId }),
      );
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenEditFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
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
          className={`${styles['tab']} ${
            selectedItemId === friendGroupId ? styles['selected'] : ''
          }`}
          onClick={() => {
            setExpanded(!expanded);
            setSelectedItemId(friendGroupId);
          }}
          onContextMenu={(e) => {
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'edit',
                label: lang.tr.renameFriendGroup,
                show: canManageFriendGroup,
                onClick: () => handleOpenEditFriendGroup(friendGroupId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.friendDeleteGroup,
                show: canManageFriendGroup,
                onClick: () => handleDeleteFriendGroup(friendGroupId, userId),
              },
            ]);
          }}
        >
          <div
            className={`${styles['toggleIcon']} ${
              expanded ? styles['expanded'] : ''
            }`}
          />
          <div className={styles['tabLable']}>{friendGroupName}</div>
          <div className={styles['tabCount']}>
            {`(${friendsOnlineCount}/${friendGroupFriends.length})`}
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
