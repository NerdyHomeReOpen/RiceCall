import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { openCreateFriendGroup, openSearchUser } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import FriendGroupTab from './FriendGroupTab';

import { getDefaultFriendGroup } from '@/utils/default';

import styles from './Friend.module.css';

const FriendPageSidebar: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [searchInput, setSearchInput] = useState<string>('');
  const [activeTabId, setActiveTabId] = useState<'friend' | 'recent'>('friend');

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'default', name: t('my-friends'), order: -1 }), [t]);
  const strangerFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000 }), [t]);
  const blacklistFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001 }), [t]);

  const sortedFriendGroups = [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order);
  const filteredFriends = friends.filter((f) => f.name.toLowerCase().includes(searchInput.toLowerCase()));

  const handleFriendTabClick = () => {
    setActiveTabId('friend');
  };

  const handleRecentTabClick = () => {
    setActiveTabId('recent');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleCreateFriendGroupBtnClick = () => {
    openCreateFriendGroup();
  };

  const handleAddFriendBtnClick = () => {
    openSearchUser();
  };

  return (
    <>
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['navigate-tab']} ${activeTabId === 'friend' ? styles['selected'] : ''}`} onClick={handleFriendTabClick}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['navigate-tab']} ${activeTabId === 'recent' ? styles['selected'] : ''}`} onClick={handleRecentTabClick}>
          <div className={styles['recent-icon']} />
        </div>
      </div>
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input name="search-input" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={searchInput} onChange={handleSearchInputChange} />
        <div className={styles['prev-button']} />
        <div className={styles['next-button']} />
      </div>
      <div className={styles['scroll-view']} style={activeTabId === 'friend' ? {} : { display: 'none' }}>
        <div className={styles['friend-group-list']}>
          {sortedFriendGroups.map((friendGroup) => (
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={filteredFriends} />
          ))}
        </div>
      </div>
      <div className={styles['scroll-view']} style={activeTabId === 'recent' ? {} : { display: 'none' }}>
        <div className={styles['recent-list']} />
      </div>
      <div className={styles['footer']}>
        <div className={styles['footer-button']} datatype="addGroup" onClick={handleCreateFriendGroupBtnClick}>
          {t('create-friend-group')}
        </div>
        <div className={styles['footer-button']} datatype="addFriend" onClick={handleAddFriendBtnClick}>
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendPageSidebar.displayName = 'FriendPageSidebar';

export default FriendPageSidebar;
