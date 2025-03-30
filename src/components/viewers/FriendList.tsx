import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';
import vip from '@/styles/common/vip.module.css';
// Types
import { PopupType, User, FriendGroup, UserFriend, Server } from '@/types';

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
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ friendGroup, friends }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const { id: friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends =
      friendGroupId === ''
        ? friends
        : friends.filter((fd) => fd.friendGroupId === friendGroupId);
    const friendsInServer = friendGroupFriends.filter(
      (fd) => fd.currentServerId,
    ).length;

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'rename',
                label: lang.tr.friendRenameGroup,
                show: friendGroupId !== '',
                onClick: () => {
                  ipcService.popup.open(PopupType.RENAME_FRIEND_GROUP);
                  ipcService.initialData.onRequest(
                    PopupType.RENAME_FRIEND_GROUP,
                    {
                      friendGroupId,
                      friendGroupName,
                    },
                  );
                },
              },
              {
                id: 'delete',
                label: lang.tr.delete,
                show: friendGroupId !== '',
                onClick: () => {
                  // Open Delete Group Modal
                  ipcService.popup.open(PopupType.DIALOG_ALERT);
                  ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
                    iconType: 'warning',
                    title: lang.tr.deleteFriendGroupDialog.replace(
                      '{0}',
                      friendGroupName,
                    ),
                    submitTo: PopupType.DIALOG_ALERT,
                  });
                  ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
                    socket.send.deleteFriendGroup({
                      friendGroupId,
                    });
                  });
                },
              },
            ]);
          }}
        >
          <div
            className={`${styles['toggleIcon']} ${
              expanded ? styles['expanded'] : ''
            }`}
          />
          <span className={styles['tabLable']}>{friendGroupName}</span>
          <span
            className={styles['tabCount']}
          >{`(${friendsInServer}/${friendGroupFriends.length})`}</span>
        </div>

        {/* Expanded Sections */}
        {expanded && friends && (
          <div className={styles['tabContent']}>
            {friendGroupFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendCardProps {
  friend: UserFriend;
}

const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
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
    id: friendId,
    name: friendName,
    avatarUrl: friendAvatarUrl,
    signature: friendSignature,
    vip: friendVip,
    level: friendLevel,
    // user1Id: friendUserId1,
    // user2Id: friendUserId2,
    badges: friendBadges = [],
    currentServerId: friendCurrentServerId,
  } = friend;
  const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level

  // Handlers
  // const handleOpenDirectMessage = (
  //   userId: User['id'],
  //   targetId: User['id'],
  //   targetName: User['name'],
  // ) => {
  //   ipcService.popup.open(PopupType.DIRECT_MESSAGE);
  //   ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
  //     userId,
  //     targetId,
  //     targetName,
  //   });
  // };

  const handleServerUpdate = (server: Server | null) => {
    if (!server) return;
    setFriendServerName(server.name);
  };

  const handleDeleteFriend = (friendId: UserFriend['id']) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT);
    ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
      iconType: 'warning',
      title: lang.tr.deleteFriendDialog.replace('{0}', friendName),
      submitTo: PopupType.DIALOG_ALERT,
    });
    ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
      socket.send.deleteFriend({
        friendId,
      });
    });
  };

  useEffect(() => {
    if (!friendCurrentServerId || refreshed.current) return;
    const refresh = async () => {
      refreshed.current = true;
      const server = await refreshService.server({
        serverId: friendCurrentServerId,
      });
      handleServerUpdate(server);
    };
    refresh();
  }, [friendCurrentServerId]);

  return (
    <div key={friendId}>
      {/* User View */}
      <div
        className={styles['friendCard']}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'delete',
              label: lang.tr.deleteFriend,
              onClick: () => handleDeleteFriend(friendId),
            },
          ]);
        }}
        // onDoubleClick={() => {
        //   handleOpenDirectMessage(friendUserId1, friendUserId2, friendName);
        // }}
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
                className={`${vip['vipIcon']} ${vip[`vip-small-${friendVip}`]}`}
              />
            )}
            <div className={styles['name']}>{friendName}</div>
            <div
              className={`${grade['grade']} ${grade[`lv-${friendGrade}`]}`}
            />
            <BadgeViewer badges={friendBadges} />
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
});

FriendCard.displayName = 'FriendCard';

interface FriendListViewerProps {
  user: User;
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ user }) => {
    // Hooks
    const lang = useLanguage();

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

    // Variables
    const {
      id: userId,
      friends: userFriends = [],
      friendGroups: userFriendGroups = [],
    } = user;
    userFriends.sort((a, b) => {
      if (a.currentServerId && !b.currentServerId) return -1;
      if (!a.currentServerId && b.currentServerId) return 1;
      return 0;
    });
    const filteredFriends = userFriends.filter((fd) =>
      fd.name.includes(searchQuery),
    );
    const defaultFriendGroup: FriendGroup = createDefault.friendGroup({
      name: `${lang.tr.myFriends}`,
      order: 0,
      userId,
    });

    // Handlers
    const handleOpenAddFriend = (userId: User['id'], targetId: User['id']) => {
      ipcService.popup.open(PopupType.ADD_FRIEND);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleOpenAddSubGroups = () => {
      ipcService.popup.open(PopupType.ADD_FRIEND_SUBGROUPS);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND_SUBGROUPS, {
        userId,
      });
    };

    // const handleOpenCreateGroupPopup = () => {
    //   // ipcService.popup.open(PopupType.CREATE_FRIEND_GROUP);
    // };

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

        {/* Friend List */}
        {selectedTabId == 0 && (
          <div className={styles['friendList']}>
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
            {/* Friend Groups */}
            <div className={styles['friendGroups']}>
              {[defaultFriendGroup, ...userFriendGroups].map((friendGroup) => (
                <FriendGroupTab
                  key={friendGroup.id}
                  friendGroup={friendGroup}
                  friends={filteredFriends}
                />
              ))}
            </div>
            {/* Bottom Buttons */}
            <div className={styles['bottomButtons']}>
              <div
                className={styles['button']}
                datatype="addGroup"
                onClick={() => handleOpenAddSubGroups()}
              >
                {lang.tr.friendAddGroup}
              </div>
              <div
                className={styles['button']}
                datatype="addFriend"
                onClick={() => handleOpenAddFriend(userId, '_')}
              >
                {lang.tr.addFriend}
              </div>
            </div>
          </div>
        )}

        {/* Recent */}
        {selectedTabId == 1 && <div className={styles['recentList']}></div>}
      </>
    );
  },
);

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;
