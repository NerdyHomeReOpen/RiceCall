import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend, Server } from '@/types';

// Components
import BadgeListViewer from '@/components/viewers/BadgeList';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface FriendGroupTabProps {
  user: User;
  friendGroup: FriendGroup;
  friends: UserFriend[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ user, friendGroup, friends, selectedItemId, setSelectedItemId }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const { userId } = user;
    const { friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends =
      friendGroupId === '' ? friends.filter((fd) => !fd.friendGroupId).sort((a, b) => {
          return (b.online ? 1 : 0) - (a.online ? 1 : 0);
        })
      : friendGroupId === 'blocked' ? friends.filter((friend) => {
          return friend.isBlocked;
        })
      : friends.filter((fd) => fd.friendGroupId === friendGroupId).sort((a, b) => {
          return (b.online ? 1 : 0) - (a.online ? 1 : 0);
        });
    const friendsOnlineCount = friendGroupFriends.filter(
      (fd) => fd.online ?? fd.currentServerId,
    ).length;
    const canManageFriendGroup = friendGroupId !== '';

    // Handlers
    const handleDeleteFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.deleteFriendGroupDialog.replace('{0}', friendGroupName),
        () => socket.send.deleteFriendGroup({ friendGroupId, userId }),
      );
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenEditFriendGroup = (
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_FRIENDGROUP, 'editFriendGroup');
      ipcService.initialData.onRequest('editFriendGroup', {
        friendGroupId,
        userId,
      });
    };

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={`${styles['tab']} ${
            selectedItemId === friendGroupId ? styles['selected'] : ''
          }`}
          onClick={() => {
            setExpanded(!expanded);
            setSelectedItemId(friendGroupId);
          }}
          onContextMenu={(e) => {
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'edit',
                label: lang.tr.renameFriendGroup,
                show: canManageFriendGroup,
                onClick: () => handleOpenEditFriendGroup(friendGroupId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.friendDeleteGroup,
                show: canManageFriendGroup,
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
            {`(${friendsOnlineCount}/${friendGroupFriends.length})`}
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
            <FriendCard
              user={user}
              key={friend.targetId}
              friend={friend}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
            />
          ))}
        </div>
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendCardProps {
  user: User;
  friend: UserFriend;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
}

const FriendCard: React.FC<FriendCardProps> = React.memo(
  ({ user, friend, selectedItemId, setSelectedItemId }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Socket
    const socket = useSocket();

    // Refs
    const refreshed = useRef(false);

    // States
    const [friendServer, setFriendServer] = useState<Server>(
      createDefault.server(),
    );

    // Variables
    const { userId } = user;
    const {
      userId: friendUserId,
      targetId: friendTargetId,
      name: friendName,
      avatarUrl: friendAvatarUrl,
      signature: friendSignature,
      vip: friendVip,
      level: friendLevel,
      badges: friendBadges,
      status: friendStatus,
      currentServerId: friendCurrentServerId,
      online: friendOnlineStatus = null,
    } = friend;
    const { name: friendServerName } = friendServer;
    const isCurrentUser = friendTargetId === friendUserId;
    const canManageFriend = !isCurrentUser;
    const isFriendOnline = friendOnlineStatus ?? friendCurrentServerId !== null;

    // Handlers
    const handleServerSelect = (userId: User['userId'], server: Server) => {
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: server.displayId,
          timestamp: Date.now(),
        }),
      );
      setTimeout(() => {
        socket.send.connectServer({ userId, serverId: server.serverId });
      }, 1500);
    };

    const handleDeleteFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.deleteFriendDialog.replace('{0}', friendName),
        () => socket.send.deleteFriend({ userId, targetId }),
      );
    };

    const handleServerUpdate = (data: Server) => {
      setFriendServer(data);
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(
        PopupType.DIRECT_MESSAGE,
        `directMessage-${targetId}`,
      );
      ipcService.initialData.onRequest(`directMessage-${targetId}`, {
        userId,
        targetId,
        targetName,
      });
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
      ipcService.initialData.onRequest(`userInfo-${targetId}`, {
        userId,
        targetId,
      });
    };

    const handleOpenEditFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_FRIEND, 'editFriend');
      ipcService.initialData.onRequest('editFriend', {
        userId,
        targetId,
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
          if (server) handleServerUpdate(server);
        });
      };
      refresh();
    }, [friendCurrentServerId]);

    return (
      <div key={friendTargetId}>
        {/* User View */}
        <div
          className={`${styles['friendCard']} ${
            selectedItemId === `${friendTargetId}` ? styles['selected'] : ''
          }`}
          onClick={() => setSelectedItemId(friendTargetId)}
          onContextMenu={(e) => {
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'driectMessage',
                label: '傳送即時訊息', // TODO: lang.tr
                show: !isCurrentUser,
                onClick: () => handleOpenDirectMessage(friendUserId, friendTargetId, friendName),
              },
              {
                id: 'separator',
                label: '',
                show: canManageFriend,
              },
              {
                id: 'info',
                label: lang.tr.viewProfile,
                show: canManageFriend,
                onClick: () => handleOpenUserInfo(friendUserId, friendTargetId),
              },
              {
                id: 'editNote',
                label: '修改備註', // TODO: lang.tr
                show: canManageFriend,
                disabled: true,
                onClick: () => { /* handleFriendNote() */ }
              },
              {
                id: 'separator',
                label: '',
                show: canManageFriend,
              },
              {
                id: 'permission-setting',
                label: '權限設定',
                show: canManageFriend,
                icon: 'submenu',
                hasSubmenu: true,
                submenuItems: [
                  {
                    id: 'set-private',
                    label: '對好友隱藏上線', // TODO: lang.tr
                    show: canManageFriend,
                    disabled: true,
                    onClick: () => { /* TODO: handlePrivateFriend() */ }
                  },
                  {
                    id: 'set-notify',
                    label: '好友上線提醒我', // TODO: lang.tr
                    show: canManageFriend,
                    disabled: true,
                    onClick: () => { /* TODO: handleNotifyFriendOnline() */ }
                  },
                ],
              },
              {
                id: 'editGroup',
                label: lang.tr.editFriendGroup,
                show: canManageFriend,
                onClick: () =>
                  handleOpenEditFriend(friendUserId, friendTargetId),
              },
              {
                id: 'setBlock',
                label: '封鎖', // TODO: lang.tr
                show: canManageFriend,
                disabled: true,
                onClick: () => { /* TODO: handleBlocdFriend */ },
              },
              {
                id: 'delete',
                label: lang.tr.deleteFriend,
                show: canManageFriend,
                onClick: () => handleDeleteFriend(friendUserId, friendTargetId),
              },
            ]);
          }}
          onDoubleClick={() =>
            handleOpenDirectMessage(friendUserId, friendTargetId, friendName)
          }
        >
          <div
            className={styles['avatarPicture']}
            style={{
              backgroundImage: `url(${friendAvatarUrl})`,
              filter: !isFriendOnline ? 'grayscale(100%)' : '',
            }}
            datatype={
              isFriendOnline && friendStatus !== 'online' ? friendStatus : ''
            }
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
              <div className={`${styles['name']} ${friendVip > 0 ? styles['isVIP'] : ''}`}>{friendName}</div>
              <div
                className={`
                  ${styles['gradeIcon']} 
                  ${grade['grade']} 
                  ${grade[`lv-${Math.min(56, friendLevel)}`]}
                `}
              />
              <BadgeListViewer badges={friendBadges} maxDisplay={5} />
            </div>
            {isFriendOnline && friendCurrentServerId ? (
              <div
                className={`
                  ${styles['container']}
                  ${friendCurrentServerId ? styles['hasServer'] : ''}
                `}
                onClick={() => {
                  handleServerSelect(userId, friendServer);
                }}
              >
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
  user: User;
  friendGroups: FriendGroup[];
  friends: UserFriend[];
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ user, friendGroups, friends }) => {
    // Hooks
    const lang = useLanguage();
    const viewerRef = useRef<HTMLDivElement>(null);

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTabId, setSelectedTabId] = useState<number>(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Variables
    const { userId } = user;
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
    const outlanderFriendGroup: FriendGroup = createDefault.friendGroup({
      friendGroupId: 'outlander',
      name: `陌生人`, // TODO: lang.tr
      order: 998,
      userId,
    });
    const blockedFriendGroup: FriendGroup = createDefault.friendGroup({
      friendGroupId: 'blocked',
      name: `黑名單`, // TODO: lang.tr
      order: 999,
      userId,
    });

    // Handlers
    const handleOpenSearchUser = (userId: User['userId']) => {
      ipcService.popup.open(PopupType.SEARCH_USER, 'searchUser');
      ipcService.initialData.onRequest('searchUser', {
        userId,
      });
    };

    const handleOpenCreateFriendGroup = () => {
      ipcService.popup.open(PopupType.CREATE_FRIENDGROUP, 'createFriendGroup');
      ipcService.initialData.onRequest('createFriendGroup', {
        userId,
      });
    };

    return (
      <>
        {/* Navigation Tabs */}
        <div className={styles['navigateTabs']} ref={viewerRef}>
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
            name="query"
            type="text"
            className={styles['searchInput']}
            placeholder={lang.tr.searchFriend}
            value={searchQuery}
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
              {[defaultFriendGroup, ...friendGroups, outlanderFriendGroup, blockedFriendGroup]
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
                    user={user}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
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
