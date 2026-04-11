import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

import FriendGroupTab from '@/components/FriendGroupTab';

import { getDefaultFriendGroup } from '@/utils/default';

import styles from './Friend.module.css';

const FriendPageSidebar: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [query, setQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<'friend' | 'recent'>('friend');

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'default', name: t('my-friends'), order: -1 }), [t]);
  const strangerFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000 }), [t]);
  const blacklistFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001 }), [t]);
  const sortedFriendGroups = useMemo(
    () => [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order),
    [defaultFriendGroup, friendGroups, strangerFriendGroup, blacklistFriendGroup],
  );
  const filteredFriends = useMemo(() => friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())), [friends, query]);
  const isFriendTab = selectedTabId === 'friend';
  const isRecentTab = selectedTabId === 'recent';

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
    Actions.openCreateFriendGroup();
  };

  const handleAddFriendBtnClick = () => {
    Actions.openSearchUser();
  };

  return (
    <>
      <div className={styles['friend-page-sidebar-navigate-tabs']}>
        <div className={`${styles['friend-page-sidebar-navigate-tab']} ${isFriendTab ? styles['selected'] : ''}`} onClick={handleFriendTabClick}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['friend-page-sidebar-navigate-tab']} ${isRecentTab ? styles['selected'] : ''}`} onClick={handleRecentTabClick}>
          <div className={styles['recent-icon']} />
        </div>
      </div>
      <div className={styles['friend-page-sidebar-search-bar']}>
        <div className={styles['search-icon']} />
        <input name="query" type="text" className={styles['friend-page-sidebar-search-input']} placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
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
      <div className={styles['scroll-view']} style={isRecentTab ? {} : { display: 'none' }}>
        <div className={styles['recent-list']} />
      </div>
      <div className={styles['friend-page-sidebar-footer']}>
        <div className={styles['friend-page-sidebar-footer-button']} datatype="addGroup" onClick={handleCreateFriendGroupBtnClick}>
          {t('create-friend-group')}
        </div>
        <div className={styles['friend-page-sidebar-footer-button']} datatype="addFriend" onClick={handleAddFriendBtnClick}>
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendPageSidebar.displayName = 'FriendPageSidebar';

export default FriendPageSidebar;
