import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import FriendGroupTab from '@/components/FriendGroupTab';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';

import styles from '@/styles/friend.module.css';

interface FriendListProps {
  user: Types.User;
  friends: Types.Friend[];
  friendGroups: Types.FriendGroup[];
}

const FriendList: React.FC<FriendListProps> = React.memo(({ user, friendGroups, friends }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Variables
  const { userId } = user;
  const filteredFriends = useMemo(() => friends.filter((f) => f.name.includes(searchQuery)), [friends, searchQuery]);
  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: -1, userId });
  const strangerFriendGroup = Default.friendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000, userId });
  const blacklistFriendGroup = Default.friendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001, userId });
  const filteredFriendGroups = useMemo(
    () => [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order),
    [defaultFriendGroup, friendGroups, strangerFriendGroup, blacklistFriendGroup],
  );
  const isSelectedFriendList = selectedTabId === 0;
  const isSelectedRecentList = selectedTabId === 1;

  return (
    <>
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['tab']} ${isSelectedFriendList ? styles['selected'] : ''}`} onClick={() => setSelectedTabId(0)}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['tab']} ${isSelectedRecentList ? styles['selected'] : ''}`} onClick={() => setSelectedTabId(1)}>
          <div className={styles['recent-icon']} />
        </div>
      </div>
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className={styles['prev-icon']} />
        <div className={styles['next-icon']} />
      </div>
      <div className={styles['scroll-view']} style={isSelectedFriendList ? {} : { display: 'none' }}>
        <div className={styles['friend-group-list']}>
          {filteredFriendGroups.map((friendGroup) => (
            <FriendGroupTab
              key={friendGroup.friendGroupId}
              friendGroup={friendGroup}
              friendGroups={[defaultFriendGroup, ...friendGroups]}
              friends={filteredFriends}
              user={user}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
            />
          ))}
        </div>
      </div>
      <div className={styles['recent-list']} style={isSelectedRecentList ? {} : { display: 'none' }}></div>
      <div className={styles['sidebar-footer']}>
        <div className={styles['button']} datatype="addGroup" onClick={() => Popup.openCreateFriendGroup()}>
          {t('create-friend-group')}
        </div>
        <div className={styles['button']} datatype="addFriend" onClick={() => Popup.openSearchUser(userId)}>
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendList.displayName = 'FriendList';

export default FriendList;
