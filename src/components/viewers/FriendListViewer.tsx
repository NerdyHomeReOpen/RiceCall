/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Trash } from 'lucide-react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Types
import { popupType, type User, type Friend, type FriendGroup } from '@/types';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Providers
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface FriendGroupProps {
  friendGroup: FriendGroup;
  friends: Friend[];
}

const FriendGroup: React.FC<FriendGroupProps> = React.memo(
  ({ friendGroup, friends }) => {
    // Language
    const lang = useLanguage();

    // Context Menu
    const contextMenu = useContextMenu();

    // Variables
    const groupName = friendGroup.name;
    const groupFriends = friends.filter((fd) => fd.groupId == friendGroup.id);

    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    return (
      <div key={friendGroup.id}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                onClick: () => {
                  // Open Delete Group Modal
                },
              },
            ]);
          }}
        >
          <div
            className={`${styles['toggleIcon']} ${
              expanded ? styles['expanded'] : ''
            }`}
          />
          <span className={styles['tabLable']}>{groupName}</span>
          <span
            className={styles['tabCount']}
          >{`(${groupFriends.length})`}</span>
        </div>

        {/* Expanded Sections */}
        {expanded && groupFriends && (
          <div className={styles['tabContent']}>
            {groupFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

interface FriendCardProps {
  friend: Friend;
}
const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  // Language
  const lang = useLanguage();

  // Context Menu
  const contextMenu = useContextMenu();

  // Variables
  const friendUser = friend.user || {
    id: '',
    name: lang.tr.unknownUser,
    avatar: '',
    avatarUrl: '',
    signature: '',
    status: 'online',
    gender: 'Male',
    level: 0,
    xp: 0,
    requiredXp: 0,
    progress: 0,
    currentChannelId: '',
    currentServerId: '',
    lastActiveAt: 0,
    createdAt: 0,
  };
  const friendAvatarUrl = friendUser.avatarUrl;
  const friendName = friendUser.name;
  const friendSignature = friendUser.signature;
  const friendLevel = friendUser.level;
  const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level
  const friendBadges = friendUser.badges || [];

  // Handlers
  const handleOpenDirectMessagePopup = () => {
    ipcService.popup.open(popupType.DIRECT_MESSAGE);
    ipcService.initialData.onRequest(popupType.DIRECT_MESSAGE, {
      user: friendUser,
    });
  };

  return (
    <div key={friend.id}>
      {/* User View */}
      <div
        className={styles['friendCard']}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: lang.tr.deleteFriend,
              onClick: () => {
                // Open Delete Friend Modal
              },
            },
          ]);
        }}
        onDoubleClick={() => {
          handleOpenDirectMessagePopup();
        }}
      >
        <div
          className={styles['avatarPicture']}
          style={{ backgroundImage: `url(${friendAvatarUrl})` }}
        />
        <div className={styles['baseInfoBox']}>
          <div className={styles['container']}>
            <div className={styles['name']}>{friendName}</div>
            <div
              className={`${styles['userGrade']} ${grade[`lv-${friendGrade}`]}`}
            />
            <BadgeViewer badges={friendBadges} />
          </div>
          <div className={styles['signature']}>{friendSignature}</div>
        </div>
      </div>
    </div>
  );
});

interface FriendListViewerProps {
  friendGroups: FriendGroup[];
  friends: Friend[];
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ friendGroups, friends }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);

    // Language
    const lang = useLanguage();

    // Search Control
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredFriends =
      friends.filter((friend) => friend.user?.name.includes(searchQuery)) ?? [];

    // Tab Control
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

    // Handlers
    const handleOpenApplyFriendPopup = () => {
      ipcService.popup.open(popupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(popupType.APPLY_FRIEND, {
        user: user,
      });
    };

    // const handleOpenCreateGroupPopup = () => {
    //   // ipcService.popup.open(popupType.CREATE_FRIEND_GROUP);
    // };

    return (
      <>
        {/* Navigation Tabs */}
        <div className={styles['navigateTabs']}>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 0 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(0)}
          >
            <div className={styles['friendListIcon']} />
          </div>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 1 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(1)}
          >
            <div className={styles['recentIcon']} />
          </div>
        </div>

        {/* Friend List */}
        {selectedTabId == 0 && (
          <div className={styles['friendList']}>
            {/* Search Bar */}
            <div className={styles['searchBar']}>
              <div className={styles['searchIcon']} />
              <input
                type="text"
                placeholder={lang.tr.searchFriend}
                className={styles['searchInput']}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className={styles['prevIcon']} />
              <div className={styles['nextIcon']} />
            </div>
            {/* Friend Groups */}
            <div className={styles['friendGroups']}>
              {friendGroups.map((group) => (
                <FriendGroup
                  key={group.id}
                  friendGroup={group}
                  friends={filteredFriends}
                />
              ))}
            </div>
            {/* Bottom Buttons */}
            <div className={styles['bottomButtons']}>
              <div className={styles['button']} datatype="addGroup">
                {lang.tr.friendAddGroup}
              </div>
              <div
                className={styles['button']}
                datatype="addFriend"
                onClick={() => {
                  handleOpenApplyFriendPopup();
                }}
              >
                {lang.tr.addFriend}
              </div>
            </div>
          </div>
        )}

        {/* Recent */}
        {selectedTabId == 1 && <div className={styles['recentList']}></div>}
      </>
    );
  },
);

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;
