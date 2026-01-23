import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import FriendGroupTab from '@/components/FriendGroupTab';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';

import styles from '@/styles/friend.module.css';

const FriendList: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  // States
  const [query, setQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<'friend' | 'recent'>('friend');

  // Variables
  const defaultFriendGroup = useMemo(() => Default.friendGroup({ friendGroupId: 'default', name: t('my-friends'), order: -1 }), [t]);
  const strangerFriendGroup = useMemo(() => Default.friendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000 }), [t]);
  const blacklistFriendGroup = useMemo(() => Default.friendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001 }), [t]);
  const sortedFriendGroups = useMemo(
    () => [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order),
    [defaultFriendGroup, friendGroups, strangerFriendGroup, blacklistFriendGroup],
  );
  const filteredFriends = useMemo(() => friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())), [friends, query]);
  const isFriendTab = selectedTabId === 'friend';
  const isRecentTab = selectedTabId === 'recent';

  // Handlers
  const handleFriendTabClick = () => {
    setSelectedTabId('friend');
  };

  const handleRecentTabClick = () => {
    setSelectedTabId('recent');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleCreateFriendGroupBtnClick = () => {
    Popup.openCreateFriendGroup();
  };

  const handleAddFriendBtnClick = () => {
    Popup.openSearchUser();
  };

  return (
    <>
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['tab']} ${isFriendTab ? styles['selected'] : ''}`} onClick={handleFriendTabClick}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['tab']} ${isRecentTab ? styles['selected'] : ''}`} onClick={handleRecentTabClick}>
          <div className={styles['recent-icon']} />
        </div>
      </div>
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
        <div className={styles['prev-icon']} />
        <div className={styles['next-icon']} />
      </div>
      <div className={styles['scroll-view']} style={isFriendTab ? {} : { display: 'none' }}>
        <div className={styles['friend-group-list']}>
          {sortedFriendGroups.map((friendGroup) => (
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={filteredFriends} />
          ))}
        </div>
      </div>
      <div className={styles['recent-list']} style={isRecentTab ? {} : { display: 'none' }} />
      <div className={styles['sidebar-footer']}>
        <div className={styles['button']} datatype="addGroup" onClick={handleCreateFriendGroupBtnClick}>
          {t('create-friend-group')}
        </div>
        <div className={styles['button']} datatype="addFriend" onClick={handleAddFriendBtnClick}>
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendList.displayName = 'FriendList';

export default FriendList;
