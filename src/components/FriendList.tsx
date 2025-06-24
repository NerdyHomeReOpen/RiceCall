import React, { useRef, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

// Components
import FriendGroupTab from '@/components/FriendGroupTab';

interface FriendListProps {
  user: User;
  friendGroups: FriendGroup[];
  friends: UserFriend[];
}

const FriendList: React.FC<FriendListProps> = React.memo(({ user, friendGroups, friends }) => {
  // Hooks
  const lang = useLanguage();
  const viewerRef = useRef<HTMLDivElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Variables
  const { userId } = user;

  const filteredFriends = friends.filter((fd) => fd.name.includes(searchQuery));

  const defaultFriendGroup: FriendGroup = Default.friendGroup({
    name: `${lang.tr.myFriends}`,
    order: 0,
    userId,
  });

  const outlanderFriendGroup: FriendGroup = Default.friendGroup({
    friendGroupId: 'outlander',
    name: `陌生人`, // TODO: lang.tr
    order: 998,
    userId,
  });

  const blockedFriendGroup: FriendGroup = Default.friendGroup({
    friendGroupId: 'blocked',
    name: `黑名單`, // TODO: lang.tr
    order: 999,
    userId,
  });

  // Handlers
  const handleOpenSearchUser = (userId: User['userId']) => {
    ipcService.popup.open(PopupType.SEARCH_USER, 'searchUser');
    ipcService.initialData.onRequest('searchUser', {
      userId,
    });
  };

  const handleOpenCreateFriendGroup = () => {
    ipcService.popup.open(PopupType.CREATE_FRIENDGROUP, 'createFriendGroup');
    ipcService.initialData.onRequest('createFriendGroup', {
      userId,
    });
  };

  return (
    <>
      {/* Navigation Tabs */}
      <div className={styles['navigateTabs']} ref={viewerRef}>
        <div
          className={`${styles['tab']} ${selectedTabId == 0 ? styles['selected'] : ''}`}
          onClick={() => setSelectedTabId(0)}
        >
          <div className={styles['friendListIcon']} />
        </div>
        <div
          className={`${styles['tab']} ${selectedTabId == 1 ? styles['selected'] : ''}`}
          onClick={() => setSelectedTabId(1)}
        >
          <div className={styles['recentIcon']} />
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles['searchBar']}>
        <div className={styles['searchIcon']} />
        <input
          name="query"
          type="text"
          className={styles['searchInput']}
          placeholder={lang.tr.searchFriend}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={styles['prevIcon']} />
        <div className={styles['nextIcon']} />
      </div>

      {/* Friend List */}
      {selectedTabId == 0 && (
        <div className={styles['scrollView']}>
          {/* Friend Groups */}
          <div className={styles['friendList']}>
            {[defaultFriendGroup, ...friendGroups, outlanderFriendGroup, blockedFriendGroup]
              .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt))
              .map((friendGroup) => (
                <FriendGroupTab
                  key={friendGroup.friendGroupId}
                  friendGroup={friendGroup}
                  friends={filteredFriends}
                  user={user}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {selectedTabId == 1 && <div className={styles['recentList']}></div>}

      {/* Bottom Buttons */}
      <div className={styles['sidebarFooter']}>
        <div className={styles['button']} datatype="addGroup" onClick={() => handleOpenCreateFriendGroup()}>
          {lang.tr.friendAddGroup}
        </div>
        <div className={styles['button']} datatype="addFriend" onClick={() => handleOpenSearchUser(userId)}>
          {lang.tr.addFriend}
        </div>
      </div>
    </>
  );
});

FriendList.displayName = 'FriendList';

export default FriendList;
