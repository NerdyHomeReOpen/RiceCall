import React, { useRef, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const viewerRef = useRef<HTMLDivElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Variables
  const { userId } = user;

  const filteredFriends = friends.filter((fd) => fd.name.includes(searchQuery));

  const defaultFriendGroup: FriendGroup = Default.friendGroup({
    name: `${t('my-friends')}`,
    order: 0,
    userId,
  });

  const strangerFriendGroup: FriendGroup = Default.friendGroup({
    friendGroupId: 'stranger',
    name: t('stranger'),
    order: 998,
    userId,
  });

  const blacklistFriendGroup: FriendGroup = Default.friendGroup({
    friendGroupId: 'blacklist',
    name: t('blacklist'),
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
      <div className={styles['navigate-tabs']} ref={viewerRef}>
        <div
          className={`${styles['tab']} ${selectedTabId == 0 ? styles['selected'] : ''}`}
          onClick={() => setSelectedTabId(0)}
        >
          <div className={styles['friend-list-icon']} />
        </div>
        <div
          className={`${styles['tab']} ${selectedTabId == 1 ? styles['selected'] : ''}`}
          onClick={() => setSelectedTabId(1)}
        >
          <div className={styles['recent-icon']} />
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input
          name="query"
          type="text"
          className={styles['search-input']}
          placeholder={t('search-friend-placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className={styles['prev-icon']} />
        <div className={styles['next-icon']} />
      </div>

      {/* Friend List */}
      <div className={styles['scroll-view']} style={selectedTabId == 0 ? {} : { display: 'none' }}>
        {/* Friend Groups */}
        <div className={styles['friend-group-list']}>
          {[defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup]
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

      {/* Recent */}
      <div className={styles['recent-list']} style={selectedTabId == 1 ? {} : { display: 'none' }}></div>

      {/* Bottom Buttons */}
      <div className={styles['sidebar-footer']}>
        <div className={styles['button']} datatype="addGroup" onClick={() => handleOpenCreateFriendGroup()}>
          {t('create-friend-group')}
        </div>
        <div className={styles['button']} datatype="addFriend" onClick={() => handleOpenSearchUser(userId)}>
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendList.displayName = 'FriendList';

export default FriendList;
