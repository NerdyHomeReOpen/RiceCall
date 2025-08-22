import React, { useMemo, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';

// Types
import type { User, FriendGroup, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

// Components
import FriendGroupTab from '@/components/FriendGroupTab';

interface FriendListProps {
  user: User;
  friends: Friend[];
  friendGroups: FriendGroup[];
}

const FriendList: React.FC<FriendListProps> = React.memo(({ user, friendGroups, friends }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Destructuring
  const { userId } = user;

  // Memos
  const filteredFriends = useMemo(() => friends.filter((f) => f.name.includes(searchQuery)), [friends, searchQuery]);
  const defaultFriendGroup = useMemo(() => Default.friendGroup({ name: t('my-friends'), order: 0, userId }), [t, userId]);
  const strangerFriendGroup = useMemo(() => Default.friendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000, userId }), [t, userId]);
  const blacklistFriendGroup = useMemo(() => Default.friendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001, userId }), [t, userId]);
  const filteredFriendGroups = useMemo(
    () => [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)),
    [defaultFriendGroup, friendGroups, strangerFriendGroup, blacklistFriendGroup],
  );

  // Handlers
  const handleOpenSearchUser = (userId: User['userId']) => {
    ipc.popup.open('searchUser', 'searchUser', { userId });
  };

  const handleOpenCreateFriendGroup = () => {
    ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
  };

  return (
    <>
      {/* Navigation Tabs */}
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['tab']} ${selectedTabId === 0 ? styles['selected'] : ''}`} onClick={() => setSelectedTabId(0)}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['tab']} ${selectedTabId === 1 ? styles['selected'] : ''}`} onClick={() => setSelectedTabId(1)}>
          <div className={styles['recent-icon']} />
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className={styles['prev-icon']} />
        <div className={styles['next-icon']} />
      </div>

      {/* Friend List */}
      <div className={styles['scroll-view']} style={selectedTabId === 0 ? {} : { display: 'none' }}>
        {/* Friend Groups */}
        <div className={styles['friend-group-list']}>
          {filteredFriendGroups.map((friendGroup) => (
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={filteredFriends} user={user} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className={styles['recent-list']} style={selectedTabId == 1 ? {} : { display: 'none' }}></div>

      {/* Bottom Buttons */}
      <div className={styles['sidebar-footer']}>
        <div className={styles['button']} datatype="addGroup" onClick={handleOpenCreateFriendGroup}>
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
