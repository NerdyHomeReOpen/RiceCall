import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Actions from '@/action';

import { INVITATION_BASE_URL } from '@/constants';

import { useAppSelector } from '@/hooks/Store';

import { getDefaultFriendGroup } from '@/utils/default';

import styles from './InviteFriend.module.css';

interface InviteFriendPopupProps {
  id: string;
  server: Types.Server;
}

const InviteFriendPopup: React.FC<InviteFriendPopupProps> = React.memo(({ id, server }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [query, setQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ name: t('my-friends'), order: 0, userId: user.userId }), [t, user.userId]);
  const filteredFriends = useMemo(() => friends.filter((f) => !f.isBlocked && f.relationStatus === 2 && f.name.includes(query)), [friends, query]);
  const sortedFriendGroups = useMemo(() => [defaultFriendGroup, ...friendGroups].sort((a, b) => a.order - b.order), [defaultFriendGroup, friendGroups]);
  const isAllSelected = useMemo(() => filteredFriends.every((f) => selectedUserIdSet.has(f.targetId)), [filteredFriends, selectedUserIdSet]);

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
    Actions.openAlertDialog(t('invite-friend-to-server-confirm', { 0: selectedUserIds.length, 1: server.name }), () => {
      const invitationLink = `${INVITATION_BASE_URL}?sid=${server.specialId || server.displayId}`;
      const formatedMessage = `<a href='${invitationLink}' type='invitation' customLink='true' >${invitationLink}</a>`;
      for (const userId of selectedUserIds) {
        ipc.socket.send('directMessage', { targetId: userId, preset: { type: 'dm', content: formatedMessage } });
      }
      ipc.popup.close(id);
    });
  };

  return (
    <div className="popup-wrapper">
      <div className={styles['header']}>
        <div className={styles['options-content']}>
          <div className={styles['search-bar']}>
            <div className={styles['search-icon']} />
            <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
          </div>
        </div>
        <div className={`button ${selectedUserIds.length === 0 ? 'disabled' : ''}`} onClick={handleInviteFriendBtnClick}>
          {t('invite')}
        </div>
      </div>
      <div className="popup-body">
        <div className={styles['friend-group-list']}>
          <div className="row">
            <div className={styles['checkbox']}>
              <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
              {t('select-all')} {t('invite-total-for', { 0: selectedUserIds.length })}
            </div>
          </div>
          <div className={styles['scroll-view']}>
            {sortedFriendGroups.map((friendGroup) => (
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
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const friendGroupFriends = useMemo(() => {
    if (friendGroup.friendGroupId) return friends.filter((f) => f.friendGroupId === friendGroup.friendGroupId);
    else return friends.filter((f) => !f.friendGroupId);
  }, [friendGroup.friendGroupId, friends]);
  const isAllSelected = useMemo(() => friendGroupFriends.every((f) => selectedUserIdSet.has(f.targetId)), [friendGroupFriends, selectedUserIdSet]);

  const handleSelectAllChange = () => {
    if (isAllSelected) friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? onSelect(userId) : null));
    else friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? null : onSelect(userId)));
  };

  const handleTabClick = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleSelect = (userId: Types.User['userId']) => {
    onSelect(userId);
  };

  return (
    <>
      <div className={`${styles['friend-group-tab']}`}>
        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
        <div className={`${styles['friend-group-tab-details']} ${selectedUserIdSet.has(friendGroup.friendGroupId) ? styles['selected'] : ''}`} onClick={handleTabClick}>
          <div className={`${styles['friend-group-tab-toggle-icon']} ${isExpanded ? styles['expanded'] : ''}`} />
          <div className={styles['friend-group-tab-label']}>{friendGroup.name}</div>
          <div className={styles['friend-group-tab-count-text']}>{`(${friendGroupFriends.length})`}</div>
        </div>
      </div>
      <div className={styles['friend-group-tab-content']} style={isExpanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} selectedUserIdSet={selectedUserIdSet} onSelect={handleSelect} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendTabProps {
  friend: Types.Friend;
  selectedUserIdSet: Set<Types.User['userId']>;
  onSelect: (id: Types.User['userId']) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend, selectedUserIdSet, onSelect }) => {
  const isSelected = selectedUserIdSet.has(friend.targetId);
  const hasVip = friend.vip > 0;
  const hasNote = !!friend.note;

  const handleTabClick = () => {
    onSelect(friend.targetId);
  };

  return (
    <div className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <input type="checkbox" checked={isSelected} readOnly />
      <div className={styles['friend-tab-avatar-picture']}>
        <Image src={friend.avatarUrl} alt="friend_avatar" width={25} height={25} loading="lazy" draggable="false" />
      </div>
      <div className={styles['friend-tab-base-info-box']}>
        {hasVip && <div className={`vip-icon vip-${friend.vip}`} />}
        <div className={`${styles['friend-tab-name-text']} ${hasVip ? styles['vip'] : ''}`}>
          {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
        </div>
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';
