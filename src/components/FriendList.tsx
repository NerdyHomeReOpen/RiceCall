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
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  return (
    <>
      <div className={styles['navigate-tabs']}>
        <div className={`${styles['tab']} ${isSelectedFriendList ? styles['selected'] : ''}`} onClick={() => setSelectedTabId('friend')}>
          <div className={styles['friend-list-icon']} />
        </div>
        <div className={`${styles['tab']} ${isSelectedRecentList ? styles['selected'] : ''}`} onClick={() => setSelectedTabId('recent')}>
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
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} searchQuery={searchQuery} />
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
