import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';

import styles from '@/styles/inviteFriend.module.css';
import popupStyles from '@/styles/popup.module.css';
import vipStyles from '@/styles/vip.module.css';

import { INVITATION_BASE_URL } from '@/constant';

interface InviteFriendPopupProps {
  server: Types.Server;
}

const InviteFriendPopup: React.FC<InviteFriendPopupProps> = React.memo(({ server }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const friends = useAppSelector((state) => state.friends.data);
  const friendGroups = useAppSelector((state) => state.friendGroups.data);

  // States
  const [query, setQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Variables
  const { userId } = user;
  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: 0, userId });
  const filteredFriends = useMemo(() => friends.filter((f) => !f.isBlocked && f.relationStatus === 2 && f.name.includes(query)), [friends, query]);
  const filteredFriendGroups = useMemo(() => [defaultFriendGroup, ...friendGroups].sort((a, b) => a.order - b.order), [defaultFriendGroup, friendGroups]);
  const isAllSelected = filteredFriends.every((f) => selectedUserIdSet.has(f.targetId));

  // Handlers
  const handleSelect = (userId: Types.User['userId']) => {
    if (selectedUserIdSet.has(userId)) setSelectedUserIds((prev) => prev.filter((userId) => userId !== userId));
    else setSelectedUserIds((prev) => [...prev, userId]);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedUserIds(filteredFriends.map((f) => f.targetId));
    else setSelectedUserIds([]);
  };

  const handleInviteFriendBtnClick = () => {
    if (selectedUserIds.length === 0) return;
    Popup.openAlertDialog(t('invite-friend-to-server-confirm', { 0: selectedUserIds.length, 1: server.name }), () => {
      const invitationLink = `${INVITATION_BASE_URL}?sid=${server.specialId || server.displayId}`;
      const formatedMessage = `<a href='${invitationLink}' type='invitation' customLink='true' >${invitationLink}</a>`;
      for (const userId of selectedUserIds) {
        ipc.socket.send('directMessage', { targetId: userId, preset: { type: 'dm', content: formatedMessage } });
      }
      ipc.window.close();
    });
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={styles['header']}>
        <div className={styles['options-content']}>
          <div className={styles['search-bar']}>
            <div className={styles['search-icon']} />
            <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
          </div>
        </div>
        <div className={`${styles['confirm-button']} ${selectedUserIds.length === 0 ? styles['disabled'] : ''}`} onClick={handleInviteFriendBtnClick}>
          {t('invite')}
        </div>
      </div>
      <div className={`${popupStyles['popup-body']}`}>
        <div className={styles['friend-group-list']}>
          <div className={`${popupStyles['row']} ${styles['space-between']}`}>
            <div className={styles['checkbox']}>
              <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
              {t('select-all')}
            </div>
            {t('invite-total-for', { 0: selectedUserIds.length })}
          </div>
          <div className={styles['scroll-view']}>
            {filteredFriendGroups.map((friendGroup) => (
              <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={filteredFriends} selectedUserIdSet={selectedUserIdSet} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

InviteFriendPopup.displayName = 'InviteFriendPopup';

export default InviteFriendPopup;

interface FriendGroupTabProps {
  friends: Types.Friend[];
  friendGroup: Types.FriendGroup;
  selectedUserIdSet: Set<Types.User['userId']>;
  onSelect: (id: Types.User['userId']) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friends, friendGroup, selectedUserIdSet, onSelect }) => {
  // States
  const [expanded, setExpanded] = useState<boolean>(true);

  // Variables
  const { friendGroupId, name: friendGroupName } = friendGroup;
  const friendGroupFriends = useMemo(() => {
    switch (friendGroupId) {
      case '':
        return friends.filter((f) => !f.friendGroupId);
      default:
        return friends.filter((f) => f.friendGroupId === friendGroupId);
    }
  }, [friendGroupId, friends]);
  const isAllSelected = friendGroupFriends.every((f) => selectedUserIdSet.has(f.targetId));

  // Functions
  const handleSelectAllChange = () => {
    if (isAllSelected) friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? onSelect(userId) : null));
    else friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? null : onSelect(userId)));
  };

  const handleTabClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleSelect = (userId: Types.User['userId']) => {
    onSelect(userId);
  };

  return (
    <div key={friendGroupId}>
      <div className={`${styles['friend-group-tab']}`}>
        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
        <div className={`${styles['friend-group-details']} ${selectedUserIdSet.has(friendGroupId) ? styles['selected'] : ''}`} onClick={handleTabClick}>
          <div className={`${styles['toggle-icon']} ${expanded ? styles['expanded'] : ''}`} />
          <div className={styles['tab-label']}>{friendGroupName}</div>
          <div className={styles['tab-count']}>{`(${friendGroupFriends.length})`}</div>
        </div>
      </div>
      <div className={styles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} selectedUserIdSet={selectedUserIdSet} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendTabProps {
  friend: Types.Friend;
  selectedUserIdSet: Set<Types.User['userId']>;
  onSelect: (id: Types.User['userId']) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend, selectedUserIdSet, onSelect }) => {
  // Variables
  const { targetId, name: friendName, note: friendNote, avatarUrl: friendAvatarUrl, vip: friendVip } = friend;
  const isSelected = selectedUserIdSet.has(targetId);

  // Handlers
  const handleTabClick = () => {
    onSelect(targetId);
  };

  return (
    <div key={targetId} className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <input type="checkbox" checked={isSelected} readOnly />
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${friendAvatarUrl})` }} />
      <div className={styles['friend-info']}>
        {friendVip > 0 && <div className={`${vipStyles['vip-icon']} ${vipStyles[`vip-${friendVip}`]}`} />}
        <div className={`${styles['name-text']} ${friendVip > 0 ? vipStyles['vip-name-color'] : ''}`}>
          {friendNote || friendName} {friendNote !== '' ? `(${friendName})` : ''}
        </div>
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';
