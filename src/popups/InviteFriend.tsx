import React, { useMemo, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/inviteFriend.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { Server, Friend, FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';
import Default from '@/utils/default';

interface FriendTabProps {
  server: Server;
  friend: Friend;
  selectedUserIdSet: Set<string>;
  onSelected: (id: string) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ server, friend, selectedUserIdSet, onSelected }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { serverId } = server;
  const { targetId, name: friendName, note: friendNote, avatarUrl: friendAvatarUrl, vip: friendVip, currentServerId: friendCurrentServerId, shareCurrentServer: friendShareCurrentServer } = friend;
  const isSameCurrentServer = !!friendShareCurrentServer && serverId === friendCurrentServerId;

  // Effects

  return (
    <div
      key={targetId}
      className={`${styles['friend-tab']} ${isSameCurrentServer ? styles['disabled'] : ''} ${selectedUserIdSet.has(targetId) && !isSameCurrentServer ? styles['selected'] : ''}`}
      onClick={() => {
        if (isSameCurrentServer) return;
        onSelected(targetId);
      }}
    >
      <input type="checkbox" className={`${isSameCurrentServer ? styles['disabled'] : ''}`} disabled={isSameCurrentServer} checked={selectedUserIdSet.has(targetId)} readOnly />
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${friendAvatarUrl})` }} />
      <div className={styles['friend-info']}>
        {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
        <div className={`${styles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>
          {friendNote || friendName} {friendNote !== '' ? `(${friendName})` : ''}
        </div>
        {isSameCurrentServer ? <span style={{ marginLeft: '10px' }}>({t('already-in-server')})</span> : null}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

interface FriendGroupTabProps {
  server: Server;
  friends: Friend[];
  searchQuery: string;
  friendGroup: FriendGroup;
  selectedUserIdSet: Set<string>;
  onSelected: (id: string) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ server, friendGroup, friends, searchQuery, selectedUserIdSet, onSelected }) => {
  // Refs
  const groupCheckboxRef = useRef<HTMLInputElement>(null);

  // States
  const [expanded, setExpanded] = useState<boolean>(true);

  // Variables
  const { friendGroupId, name: friendGroupName } = friendGroup;
  const { serverId } = server;
  const friendGroupFriends = useMemo(() => {
    switch (friendGroupId) {
      case '':
        return friends.filter((f) => !f.isBlocked && f.relationStatus === 2 && f.status !== 'offline' && !f.friendGroupId);
      default:
        return friends.filter((f) => !f.isBlocked && f.relationStatus === 2 && f.status !== 'offline' && f.friendGroupId === friendGroupId);
    }
  }, [friendGroupId, friends]);

  const filteredFriendsByName = friendGroupFriends.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())); // using for display
  // using for all selection
  const filteredFriendsNotInServer = friendGroupFriends.filter((f) => !f.shareCurrentServer || f.currentServerId !== serverId);
  const allSelectedInGroup = filteredFriendsNotInServer.every((f) => selectedUserIdSet.has(f.targetId));

  return (
    <div key={friendGroupId}>
      {/* Tab View */}
      <div className={`${styles['friend-group-tab']}`}>
        <input
          ref={groupCheckboxRef}
          type="checkbox"
          checked={allSelectedInGroup}
          onChange={(e) => {
            const groupIds = filteredFriendsNotInServer.map((f) => f.targetId);
            groupIds.forEach((id) => {
              if (e.target.checked ? !selectedUserIdSet.has(id) : selectedUserIdSet.has(id)) {
                onSelected(id);
              }
            });
          }}
        />
        <div className={`${styles['friend-group-details']} ${selectedUserIdSet.has(friendGroupId) ? styles['selected'] : ''}`} onClick={() => setExpanded((prev) => !prev)}>
          <div className={`${styles['toggle-icon']} ${expanded ? styles['expanded'] : ''}`} />
          <div className={styles['tab-label']}>{friendGroupName}</div>
          <div className={styles['tab-count']}>{`(${friendGroupFriends.length})`}</div>
        </div>
      </div>

      {/* Expanded Sections */}
      <div className={styles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {filteredFriendsByName.map((friend) => (
          <FriendTab server={server} key={friend.targetId} friend={friend} selectedUserIdSet={selectedUserIdSet} onSelected={onSelected} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

interface InviteFriendPopupProps {
  userId: string;
  server: Server;
  friends: Friend[];
  friendGroups: FriendGroup[];
}

const InviteFriendPopup: React.FC<InviteFriendPopupProps> = React.memo(({ userId, server, friends, friendGroups }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const allSelectRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Variables
  const { serverId } = server;

  const selectedUserIdSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: 0, userId });
  const filteredFriendGroups = [defaultFriendGroup, ...friendGroups].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt));

  // using for all selection
  const filteredFriendsNotInServer = friends.filter((f) => !f.isBlocked && f.relationStatus === 2 && f.status !== 'offline' && (!f.shareCurrentServer || f.currentServerId !== serverId));
  const allUsersSelected = filteredFriendsNotInServer.every((f) => selectedUserIdSet.has(f.targetId));

  // Handlers
  const handleUpdateSelectedUserIds = (id: string) => {
    if (selectedUserIdSet.has(id)) {
      setSelectedUserIds((prev) => prev.filter((userId) => userId !== id));
    } else {
      setSelectedUserIds((prev) => [...prev, id]);
    }
  };

  const handleInviteFriend = () => {
    if (selectedUserIds.length === 0) return;
    handleOpenAlertDialog(t('invite-friend-to-server-confirm', { 0: selectedUserIds.length, 1: server.name }), () => {
      // ipc.socket.emit('inviteFriendsToServer', { serverId, targetIds: selectedUserIds });
      handleClose();
    });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['header']}>
        <div className={styles['options-content']}>
          <div className={styles['search-bar']}>
            <div className={styles['search-icon']} />
            <input name="query" type="text" className={styles['search-input']} placeholder={t('search-friend-placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className={`${styles['confirm-button']} ${selectedUserIds.length === 0 ? 'disabled' : ''}`} onClick={() => handleInviteFriend()}>
          {t('invite')}
        </div>
      </div>
      {/* Body */}
      <div className={`${popup['popup-body']}`}>
        <div className={styles['friend-group-list']}>
          <div className={`${popup['row']} ${styles['space-between']}`}>
            <div className={styles['checkbox']}>
              <input
                ref={allSelectRef}
                type="checkbox"
                checked={allUsersSelected}
                onChange={(e) => {
                  if (e.target.checked) setSelectedUserIds(filteredFriendsNotInServer.map((f) => f.targetId));
                  else setSelectedUserIds([]);
                }}
              />{' '}
              {t('select-all')}
            </div>
            {` ${t('invite-total-for', { 0: selectedUserIds.length })}`}
          </div>
          <div className={styles['scroll-view']}>
            {filteredFriendGroups.map((friendGroup) => (
              <FriendGroupTab
                key={friendGroup.friendGroupId}
                server={server}
                friendGroup={friendGroup}
                friends={friends}
                searchQuery={searchQuery}
                selectedUserIdSet={selectedUserIdSet}
                onSelected={handleUpdateSelectedUserIds}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

InviteFriendPopup.displayName = 'InviteFriendPopup';

export default InviteFriendPopup;
