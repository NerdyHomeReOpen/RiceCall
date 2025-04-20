import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
// Types
import {
  PopupType,
  User,
  FriendGroup,
  UserFriend,
  Server,
  // Friend,
} from '@/types';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import { createDefault } from '@/utils/createDefault';
import refreshService from '@/services/refresh.service';

interface FriendGroupTabProps {
  friendGroup: FriendGroup;
  friends: UserFriend[];
  userId: User['userId'];
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ friendGroup, friends, userId }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const { friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends =
      friendGroupId === ''
        ? friends
        : friends.filter((fd) => fd.friendGroupId === friendGroupId);
    const friendsInServer = friendGroupFriends.filter(
      (fd) => fd.currentServerId,
    ).length;

    // Handlers
    const handleOpenEditFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_FRIENDGROUP);
      ipcService.initialData.onRequest(PopupType.EDIT_FRIENDGROUP, {
        friendGroupId,
        userId,
      });
    };

    const handleDeleteFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.DIALOG_ALERT);
      ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
        iconType: 'warning',
        title: lang.tr.deleteFriendGroupDialog.replace('{0}', friendGroupName),
        submitTo: PopupType.DIALOG_ALERT,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
        socket.send.deleteFriendGroup({ friendGroupId, userId });
      });
    };

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editFriendGroup,
                show: friendGroupId !== '',
                onClick: () => handleOpenEditFriendGroup(friendGroupId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.delete,
                show: friendGroupId !== '',
                onClick: () => handleDeleteFriendGroup(friendGroupId, userId),
              },
            ]);
          }}
        >
          <div
            className={`${styles['toggleIcon']} ${
              expanded ? styles['expanded'] : ''
            }`}
          />
          <div className={styles['tabLable']}>{friendGroupName}</div>
          <div className={styles['tabCount']}>
            {`(${friendsInServer}/${friendGroupFriends.length})`}
          </div>
        </div>

        {/* Expanded Sections */}
        <div
          className={styles['tabContent']}
          style={{
            display: expanded ? 'block' : 'none',
          }}
        >
          {friendGroupFriends.map((friend) => (
            <FriendCard key={friend.targetId} friend={friend} userId={userId} />
          ))}
        </div>
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendCardProps {
  userId: string;
  friend: UserFriend;
}

const FriendCard: React.FC<FriendCardProps> = React.memo(
  ({ friend, userId }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Socket
    const socket = useSocket();

    // Refs
    const refreshed = useRef(false);

    // States
    const [friendServerName, setFriendServerName] = useState<Server['name']>(
      createDefault.server().name,
    );

    // Variables
    const {
      userId: friendUserId,
      targetId: friendTargetId,
      name: friendName,
      avatarUrl: friendAvatarUrl,
      signature: friendSignature,
      vip: friendVip,
      level: friendLevel,
      badges: friendBadges,
      currentServerId: friendCurrentServerId,
    } = friend;
    const friendGrade = Math.min(56, friendLevel); // 56 is max level

    // Handlers
    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(PopupType.DIRECT_MESSAGE, { targetId });
      ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
        userId,
        targetId,
        targetName,
      });
    };

    // Handlers
    const handleServerUpdate = (data: Server | null) => {
      if (!data) data = createDefault.server();
      setFriendServerName(data.name);
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.USER_INFO);
      ipcService.initialData.onRequest(PopupType.USER_INFO, {
        userId,
        targetId,
      });
    };

    const handleOpenEditFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_FRIEND);
      ipcService.initialData.onRequest(PopupType.EDIT_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleDeleteFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.DIALOG_ALERT);
      ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
        iconType: 'warning',
        title: lang.tr.deleteFriendDialog.replace('{0}', friendName),
        submitTo: PopupType.DIALOG_ALERT,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
        socket.send.deleteFriend({
          userId,
          targetId,
        });
      });
    };

    useEffect(() => {
      if (!friendCurrentServerId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.server({
            serverId: friendCurrentServerId,
          }),
        ]).then(([server]) => {
          handleServerUpdate(server);
        });
      };
      refresh();
    }, [friendCurrentServerId]);

    return (
      <div key={friendTargetId}>
        {/* User View */}
        <div
          className={styles['friendCard']}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'info',
                label: lang.tr.viewProfile,
                onClick: () => {
                  handleOpenUserInfo(userId, friendTargetId);
                },
              },
              {
                id: 'edit',
                label: lang.tr.editFriendGroup,
                onClick: () =>
                  handleOpenEditFriend(friendUserId, friendTargetId),
              },
              {
                id: 'delete',
                label: lang.tr.deleteFriend,
                onClick: () => handleDeleteFriend(friendUserId, friendTargetId),
              },
            ]);
          }}
          onDoubleClick={() => {
            handleOpenDirectMessage(friendUserId, friendTargetId, friendName);
          }}
        >
          <div
            className={styles['avatarPicture']}
            style={{
              backgroundImage: `url(${friendAvatarUrl})`,
              filter: !friendServerName ? 'grayscale(100%)' : '',
            }}
          />
          <div className={styles['baseInfoBox']}>
            <div className={styles['container']}>
              {friendVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${
                    vip[`vip-small-${friendVip}`]
                  }`}
                />
              )}
              <div className={styles['name']}>{friendName}</div>
              <div
                className={`${grade['grade']} ${grade[`lv-${friendGrade}`]}`}
              />
              <BadgeViewer badges={friendBadges} maxDisplay={5} />
            </div>
            {friendServerName ? (
              <div className={styles['container']}>
                <div className={styles['location']} />
                <div className={styles['serverName']}>{friendServerName}</div>
              </div>
            ) : (
              <div className={styles['signature']}>{friendSignature}</div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FriendCard.displayName = 'FriendCard';

interface FriendListViewerProps {
  friendGroups: FriendGroup[];
  friends: UserFriend[];
  userId: string;
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ friendGroups, friends, userId }) => {
    // Hooks
    const lang = useLanguage();

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

    // Variables
    friends.sort((a, b) => {
      if (a.currentServerId && !b.currentServerId) return -1;
      if (!a.currentServerId && b.currentServerId) return 1;
      return 0;
    });
    const filteredFriends = friends.filter((fd) =>
      fd.name.includes(searchQuery),
    );
    const defaultFriendGroup: FriendGroup = createDefault.friendGroup({
      name: `${lang.tr.myFriends}`,
      order: 0,
      userId,
    });

    // Handlers
    const handleOpenSearchUser = (userId: User['userId']) => {
      ipcService.popup.open(PopupType.SEARCH_USER);
      ipcService.initialData.onRequest(PopupType.SEARCH_USER, {
        userId,
      });
    };

    const handleOpenCreateFriendGroup = () => {
      ipcService.popup.open(PopupType.CREATE_FRIENDGROUP);
      ipcService.initialData.onRequest(PopupType.CREATE_FRIENDGROUP, {
        userId,
      });
    };

    return (
      <>
        {/* Navigation Tabs */}
        <div className={styles['navigateTabs']}>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 0 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(0)}
          >
            <div className={styles['friendListIcon']} />
          </div>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 1 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(1)}
          >
            <div className={styles['recentIcon']} />
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles['searchBar']}>
          <div className={styles['searchIcon']} />
          <input
            type="text"
            placeholder={lang.tr.searchFriend}
            className={styles['searchInput']}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={styles['prevIcon']} />
          <div className={styles['nextIcon']} />
        </div>

        {/* Friend List */}
        {selectedTabId == 0 && (
          <div className={styles['scrollView']}>
            {/* Friend Groups */}
            <div className={styles['friendList']}>
              {[defaultFriendGroup, ...friendGroups]
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                )
                .map((friendGroup) => (
                  <FriendGroupTab
                    key={friendGroup.friendGroupId}
                    friendGroup={friendGroup}
                    friends={filteredFriends}
                    userId={userId}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {selectedTabId == 1 && <div className={styles['recentList']}></div>}

        {/* Bottom Buttons */}
        <div className={styles['sidebarFooter']}>
          <div
            className={styles['button']}
            datatype="addGroup"
            onClick={() => handleOpenCreateFriendGroup()}
          >
            {lang.tr.friendAddGroup}
          </div>
          <div
            className={styles['button']}
            datatype="addFriend"
            onClick={() => handleOpenSearchUser(userId)}
          >
            {lang.tr.addFriend}
          </div>
        </div>
      </>
    );
  },
);

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;
