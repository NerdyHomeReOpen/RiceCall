import React, { useMemo, useRef, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/inviteFriend.module.css';
import friendstyles from '@/styles/friend.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, Server, Friend, FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenUserInfo, handleOpenBlockMember, handleOpenKickMemberFromServer } from '@/utils/popup';
import { isServerAdmin } from '@/utils/permission';
import { getFormatDate } from '@/utils/language';
import Default from '@/utils/default';

interface FriendTabProps {
  user: User;
  friend: Friend;
  friendGroups: FriendGroup[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ user, friend, friendGroups, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Variables
  const { userId } = user;
  const {
    targetId,
    name: friendName,
    note: friendNote,
    avatarUrl: friendAvatarUrl,
    vip: friendVip,
    status: friendStatus,
    relationStatus: friendRelationStatus,
    isBlocked: friendIsBlocked,
    currentServerId: friendCurrentServerId,
    shareCurrentServer: friendShareCurrentServer,
  } = friend;
  const isUser = targetId === userId;
  const isOnline = friendStatus !== 'offline';
  const isFriend = friendRelationStatus === 2;

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'view-profile',
      label: t('view-profile'),
      show: !isUser,
      onClick: () => handleOpenUserInfo(userId, targetId),
    },
  ];

  // Effects

  return (
    <div
      key={targetId}
      className={`${friendstyles['friend-tab']} ${styles['friend-tab']} ${selectedItemId === targetId ? friendstyles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === targetId) setSelectedItemId(null);
        else setSelectedItemId(targetId);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div
        className={styles['avatar-picture']}
        style={{ backgroundImage: `url(${friendAvatarUrl})`, filter: isOnline && isFriend && !friendIsBlocked ? '' : 'grayscale(100%)' }}
        datatype={isOnline && isFriend && !friendIsBlocked && friendStatus !== 'online' /* filter online status icon */ ? friendStatus : ''}
      />
      <div className={styles['friend-info']}>
        {friendVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${friendVip}`]}`} />}
        <div className={`${friendstyles['name-text']} ${friendVip > 0 ? vip['vip-name-color'] : ''}`}>
          {friendNote || friendName} {friendNote !== '' ? `(${friendName})` : ''}
        </div>
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

interface FriendGroupTabProps {
  user: User;
  friends: Friend[];
  friendGroup: FriendGroup;
  friendGroups: FriendGroup[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ user, friendGroup, friends, friendGroups, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const contextMenu = useContextMenu();

  // States
  const [expanded, setExpanded] = useState<boolean>(true);

  // Variables
  const { friendGroupId, name: friendGroupName } = friendGroup;
  const friendGroupFriends = useMemo(() => {
    switch (friendGroupId) {
      case '':
        return friends.filter((f) => !f.isBlocked && !f.friendGroupId && f.relationStatus !== 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Default
      case 'blacklist':
        return friends.filter((f) => f.isBlocked).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Blacklist
      case 'stranger':
        return friends.filter((f) => !f.isBlocked && f.relationStatus === 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Stranger
      default:
        return friends.filter((f) => !f.isBlocked && f.friendGroupId === friendGroupId && f.relationStatus !== 0).sort((a, b) => (b.status !== 'offline' ? 1 : 0) - (a.status !== 'offline' ? 1 : 0)); // Other
    }
  }, [friendGroupId, friends]);
  const friendsOnlineCount = useMemo(() => friendGroupFriends.filter((f) => f.status !== 'offline').length, [friendGroupFriends]);

  // Handlers
  const getContextMenuItems = () => [];

  return (
    <div key={friendGroupId}>
      {/* Tab View */}
      <div
        className={`${friendstyles['friend-group-tab']} ${selectedItemId === friendGroupId ? friendstyles['selected'] : ''}`}
        onClick={() => setExpanded((prev) => !prev)}
        onContextMenu={(e) => {
          e.preventDefault();
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
        }}
      >
        <div className={`${friendstyles['toggle-icon']} ${expanded ? friendstyles['expanded'] : ''}`} />
        <div className={friendstyles['tab-label']}>{friendGroupName}</div>
        <div className={friendstyles['tab-count']}>{`(${friendsOnlineCount}/${friendGroupFriends.length})`}</div>
      </div>

      {/* Expanded Sections */}
      <div className={friendstyles['tab-content']} style={expanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab user={user} key={friend.targetId} friend={friend} friendGroups={friendGroups} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
        ))}
      </div>
    </div>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

interface InviteFriendPopupProps {
  user: User;
  server: Server;
  friends: Friend[];
  friendGroups: FriendGroup[];
}

const InviteFriendPopup: React.FC<InviteFriendPopupProps> = React.memo(({ user, server, friends, friendGroups }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Variables
  const { userId } = user;
  const { serverId, name: serverName, visibility: serverVisibility } = server;
  const filteredFriends = friends.filter((f) => f.name.includes(searchQuery));
  const defaultFriendGroup = Default.friendGroup({ name: t('my-friends'), order: 0, userId });
  const filteredFriendGroups = [defaultFriendGroup, ...friendGroups].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt));

  // Effects
  useEffect(() => {}, []);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['header']}>
        <div className={styles['options-content']}>
          <div className={friendstyles['search-bar']}>
            <div className={friendstyles['search-icon']} />
            <input
              name="query"
              type="text"
              className={friendstyles['search-input']}
              placeholder={t('search-friend-placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={styles['confirm-button']}>{t('invite')}</div>
      </div>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={friendstyles['scroll-view']}>
          <div className={friendstyles['friend-group-list']}>
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
        <div className={styles['view-section']}></div>
      </div>
    </div>
  );
});

InviteFriendPopup.displayName = 'InviteFriendPopup';

export default InviteFriendPopup;
