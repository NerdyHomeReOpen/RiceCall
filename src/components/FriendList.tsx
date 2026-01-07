import React, { useMemo, useState } from 'react';
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
  const user = useAppSelector((state) => state.user.data);
  const friendGroups = useAppSelector((state) => state.friendGroups.data);

  // States
  const [query, setQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<'friend' | 'recent'>('friend');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Variables
  const { userId } = user;
  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: -1, userId });
  const strangerFriendGroup = Default.friendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000, userId });
  const blacklistFriendGroup = Default.friendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001, userId });
  const filteredFriendGroups = useMemo(
    () => [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order),
    [defaultFriendGroup, friendGroups, strangerFriendGroup, blacklistFriendGroup],
  );
  const isSelectedFriendList = selectedTabId === 'friend';
  const isSelectedRecentList = selectedTabId === 'recent';

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
    Popup.openSearchUser(userId);
  };

  return (
    <>
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['tab']} ${isSelectedFriendList ? styles['selected'] : ''}`} onClick={handleFriendTabClick}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['tab']} ${isSelectedRecentList ? styles['selected'] : ''}`} onClick={handleRecentTabClick}>
          <div className={styles['recent-icon']} />
        </div>
      </div>
      <div className={styles['search-bar']}>
        <div className={styles['search-icon']} />
        <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
        <div className={styles['prev-icon']} />
        <div className={styles['next-icon']} />
      </div>
      <div className={styles['scroll-view']} style={isSelectedFriendList ? {} : { display: 'none' }}>
        <div className={styles['friend-group-list']}>
          {filteredFriendGroups.map((friendGroup) => (
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} query={query} />
          ))}
        </div>
      </div>
      <div className={styles['recent-list']} style={isSelectedRecentList ? {} : { display: 'none' }} />
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
