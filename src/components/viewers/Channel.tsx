import React, { useState, useEffect } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import vip from '@/styles/common/vip.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import {
  PopupType,
  ServerMember,
  Channel,
  Server,
  User,
  Member,
  Category,
  ContextMenuItem,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useExpandedContext } from '@/providers/Expanded';
// import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Services
import ipcService from '@/services/ipc.service';

interface CategoryTabProps {
  user: User;
  server: Server;
  member: Member;
  category: Category;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({
    user,
    server,
    member,
    category,
    permissionLevel,
    expanded,
    setExpanded,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setCategoryExpanded } = useExpandedContext();
    // Variables
    const { channels: serverChannels = [] } = server;
    const { id: userId } = user;
    const { id: serverId } = server;
    const {
      id: categoryId,
      name: categoryName,
      visibility: categoryVisibility,
    } = category;
    const categoryChannels = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === categoryId);
    const userInCategory = categoryChannels.some(
      (ch) => ch.id === user.currentChannelId,
    );
    const canCreateChannel = permissionLevel > 4;
    const canDeleteCategory = permissionLevel > 4;
    const canOpenCategorySettings = permissionLevel > 4;

    // Handlers
    const handleOpenChannelSetting = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING);
      ipcService.initialData.onRequest(PopupType.CHANNEL_SETTING, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['id'],
      categoryId: Category['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId,
        userId,
      });
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(categoryId, serverId),
      );
    };

    const handleDeleteChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    // Effect
    useEffect(() => {
      if (setCategoryExpanded && userInCategory)
        setCategoryExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [categoryId]: true,
          }));
    }, [categoryId, setCategoryExpanded, setExpanded, userInCategory]);

    return (
      <>
        {/* Category View */}
        <div
          key={categoryId}
          className={`${styles['channelTab']} `}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editChannel,
                show: canOpenCategorySettings,
                onClick: () => handleOpenChannelSetting(categoryId, serverId),
              },
              {
                id: 'add',
                label: lang.tr.addChannel,
                show: canCreateChannel,
                onClick: () =>
                  handleOpenCreateChannel(serverId, categoryId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.deleteChannel,
                show: canDeleteCategory,
                onClick: () => handleOpenWarning(lang.tr.warningDeleteChannel),
              },
            ]);
          }}
        >
          <div
            className={`
              ${styles['tabIcon']} 
              ${expanded[categoryId] ? styles['expanded'] : ''}
              ${styles[categoryVisibility]}
            `}
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [categoryId]: !prev[categoryId],
              }))
            }
          />
          <div className={styles['channelTabLable']}>{categoryName}</div>
          {!expanded[categoryId] && userInCategory && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        {expanded[categoryId] && (
          <div className={styles['channelList']}>
            {categoryChannels
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel) => (
                <ChannelTab
                  key={channel.id}
                  user={user}
                  server={server}
                  member={member}
                  channel={channel}
                  permissionLevel={permissionLevel}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              ))}
          </div>
        )}
      </>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  user: User;
  server: Server;
  member: Member;
  channel: Channel;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({
    user,
    server,
    member,
    channel,
    permissionLevel,
    expanded,
    setExpanded,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setChannelExpanded } = useExpandedContext();
    // Variables
    const { id: userId } = user;
    const { id: serverId, members: serverMembers = [] } = server;
    const {
      id: channelId,
      name: channelName,
      isRoot: channelIsRoot,
      isLobby: channelIsLobby,
      visibility: channelVisibility,
      userLimit: channelUserLimit,
    } = channel;
    const { permissionLevel: userPermission } = member;
    const channelMembers = serverMembers.filter(
      (mb) => mb.currentChannelId === channelId,
    );
    const userInChannel = user.currentChannelId === channelId;
    const canJoin =
      !userInChannel &&
      channelVisibility !== 'readonly' &&
      !(channelVisibility === 'private' && permissionLevel < 3) &&
      !(channelVisibility === 'member' && permissionLevel < 2) &&
      (channelUserLimit === 0 ||
        channelUserLimit > channelMembers.length ||
        userPermission > 4);
    const canCreateChannel =
      permissionLevel > 4 && !channelIsLobby && channelIsRoot;
    const canDeleteChannel = permissionLevel > 4 && !channelIsLobby;
    const canOpenChannelSettings = permissionLevel > 4;

    // Handlers
    const handleOpenChannelSetting = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING);
      ipcService.initialData.onRequest(PopupType.CHANNEL_SETTING, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['id'],
      categoryId: Channel['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId,
        userId,
      });
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(channelId, serverId),
      );
    };

    const handleDeleteChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleJoinChannel = (
      userId: User['id'],
      channelId: Channel['id'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId });
    };

    // Effect
    useEffect(() => {
      if (setChannelExpanded && userInChannel)
        setChannelExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [channelId]: true,
          }));
    }, [channelId, setChannelExpanded, setExpanded, userInChannel]);

    return (
      <>
        {/* Channel View */}
        <div
          key={channelId}
          className={`${styles['channelTab']} `}
          onDoubleClick={() => {
            if (canJoin) handleJoinChannel(userId, channelId);
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editChannel,
                show: canOpenChannelSettings,
                onClick: () => handleOpenChannelSetting(channelId, serverId),
              },
              {
                id: 'add',
                label: lang.tr.addChannel,
                show: canCreateChannel,
                onClick: () =>
                  handleOpenCreateChannel(serverId, channelId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.deleteChannel,
                show: canDeleteChannel,
                onClick: () => handleOpenWarning(lang.tr.warningDeleteChannel),
              },
            ]);
          }}
        >
          <div
            className={`
              ${styles['tabIcon']} 
              ${expanded[channelId] ? styles['expanded'] : ''} 
              ${channelIsLobby ? styles['lobby'] : styles[channelVisibility]} 
            `}
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [channelId]: !prev[channelId],
              }))
            }
          />
          <div className={styles['channelTabLable']}>{channelName}</div>
          {channelVisibility !== 'readonly' && (
            <div className={styles['channelTabCount']}>
              {`(${channelMembers.length}${
                channelUserLimit > 0 ? `/${channelUserLimit}` : ''
              })`}
            </div>
          )}
          {userInChannel && !expanded[channelId] && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        {expanded[channelId] && (
          <div className={styles['userList']}>
            {channelMembers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((channelMember) => (
                <UserTab
                  key={channelMember.id}
                  user={user}
                  channelMember={channelMember}
                  permissionLevel={permissionLevel}
                />
              ))}
          </div>
        )}
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

interface UserTabProps {
  user: User;
  channelMember: ServerMember;
  permissionLevel: number;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, channelMember, permissionLevel }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const socket = useSocket();
    // const webRTC = useWebRTC();

    // Variables
    const { id: userId } = user;
    const {
      id: channelMemberId,
      name: channelMemberName,
      serverId: channelMemberServerId,
      permissionLevel: channelMemberPermission,
      nickname: channelMemberNickname,
      userId: channelMemberUserId,
      level: channelMemberLevel,
      gender: channelMemberGender,
      badges: channelMemberBadges = [],
      vip: channelMemberVip,
    } = channelMember;
    const channelMemberGrade = Math.min(56, channelMemberLevel); // 56 is max leve
    const isCurrentUser = userId === channelMemberUserId;
    const canEditNickname =
      (isCurrentUser && permissionLevel > 1) ||
      (permissionLevel > 4 && permissionLevel > channelMemberPermission);
    const canManageMember =
      !isCurrentUser &&
      permissionLevel > channelMemberPermission &&
      (channelMemberPermission > 1 || permissionLevel > 5);
    const canChangeToGuest =
      permissionLevel > 5 && channelMemberPermission !== 1;
    const canChangeToMember =
      permissionLevel > 2 && channelMemberPermission !== 2;
    const canChangeToChannelAdmin =
      permissionLevel > 3 && channelMemberPermission !== 3;
    const canChangeToCategoryAdmin =
      permissionLevel > 4 && channelMemberPermission !== 4;
    const canChangeToAdmin =
      permissionLevel > 5 && channelMemberPermission !== 5;

    // const isSpeaking = isCurrentUser
    //   ? webRTC.speakingUsers?.includes('local')
    //   : webRTC.speakingUsers?.includes(channelMemberUserId);
    // console.log(channelMemberUserId, webRTC.speakingUsers);

    // Handlers
    const handleOpenEditNickname = (
      serverId: Server['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME);
      ipcService.initialData.onRequest(PopupType.EDIT_NICKNAME, {
        serverId,
        userId,
      });
    };

    const handleOpenApplyFriend = (
      userId: User['id'],
      targetId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({
        member,
        userId,
        serverId,
      });
    };

    return (
      <div
        key={channelMemberId}
        className={`${styles['userTab']}`}
        onDoubleClick={(e) => {
          contextMenu.showUserInfoBlock(e.pageX, e.pageY, channelMember);
        }}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'apply-friend',
              label: lang.tr.addFriend,
              onClick: () => handleOpenApplyFriend(userId, channelMemberUserId),
              show: !isCurrentUser,
            },
            {
              id: 'edit-nickname',
              label: lang.tr.editNickname,
              onClick: () =>
                handleOpenEditNickname(
                  channelMember.serverId,
                  channelMemberUserId,
                ),
              show: canEditNickname,
            },
            {
              id: 'separator',
              label: '',
              show: canManageMember,
            },
            {
              id: 'member-management',
              label: lang.tr.memberManagement,
              show: canManageMember,
              icon: 'submenu',
              hasSubmenu: true,
              submenuItems: [
                {
                  id: 'set-guest',
                  label: lang.tr.setGuest,
                  show: canChangeToGuest,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 1 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-member',
                  label: lang.tr.setMember,
                  show: canChangeToMember,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 2 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-channel-admin',
                  label: lang.tr.setChannelAdmin,
                  show: canChangeToChannelAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 3 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-category-admin',
                  label: lang.tr.setCategoryAdmin,
                  show: canChangeToCategoryAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 4 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-admin',
                  label: lang.tr.setAdmin,
                  show: canChangeToAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 5 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
              ],
            },
          ]);
        }}
      >
        <div className={`${styles['userState']}`} />
        <div
          className={`
            ${permission[channelMemberGender]} 
            ${permission[`lv-${channelMemberPermission}`]}
          `}
        />
        {channelMemberVip > 0 && (
          <div
            className={`
              ${vip['vipIcon']} 
              ${vip[`vip-small-${channelMemberVip}`]}
            `}
          />
        )}
        <div
          className={`
            ${styles['userTabName']} 
            ${channelMemberNickname ? styles['member'] : ''}
          `}
        >
          {channelMemberNickname || channelMemberName}
        </div>
        <div
          className={`
            ${grade['grade']} 
            ${grade[`lv-${channelMemberGrade}`]}
          `}
        />
        <BadgeViewer badges={channelMemberBadges} maxDisplay={3} />
        {isCurrentUser && <div className={styles['myLocationIcon']} />}
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

interface ChannelViewerProps {
  user: User;
  server: Server;
  member: Member;
  currentChannel: Channel;
}

const ChannelViewer: React.FC<ChannelViewerProps> = React.memo(
  ({ user, server, member, currentChannel }) => {
    // Hooks
    const lang = useLanguage();
    // const socket = useSocket();
    const contextMenu = useContextMenu();
    const { handleSetCategoryExpanded, handleSetChannelExpanded } =
      useExpandedContext();

    // States
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<'all' | 'current'>('all');

    // Variables
    const connectStatus = 3;
    const { id: userId } = user;
    const {
      id: serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
      channels: serverChannels = [],
      users: serverUsers = [],
    } = server;
    const { permissionLevel: memberPermission } = member;
    const { name: currentChannelName, voiceMode: currentChannelVoiceMode } =
      currentChannel;
    const canCreateChannel = memberPermission > 4;
    const canEditNickname = memberPermission > 1;
    const canApplyMember = memberPermission < 2;
    const canOpenServerSettings = memberPermission > 4;

    // Handlers
    // FIXME: logic is wrong
    // const handleAddFavoriteServer = (serverId: Server['id']) => {
    //   if (!socket) return;
    //   socket.send.updateUser({
    //     userId,
    //     user: {
    //       ...user,
    //       favoriteServerId: serverId,
    //     },
    //   });
    //   setIsFavorite(!isFavorite);
    // };

    const handleCreateRootChannel = () => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId: null,
        userId,
      });
    };

    const handleOpenServerSetting = (
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.SERVER_SETTING);
      ipcService.initialData.onRequest(PopupType.SERVER_SETTING, {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (server.receiveApply === false) {
        ipcService.popup.open(PopupType.DIALOG_ALERT2);
        ipcService.initialData.onRequest(PopupType.DIALOG_ALERT2, {
          title: lang.tr.cannotApply,
        });
        return;
      }
      ipcService.popup.open(PopupType.APPLY_MEMBER);
      ipcService.initialData.onRequest(PopupType.APPLY_MEMBER, {
        userId,
        serverId,
      });
    };

    const handleOpenEditNickname = (
      serverId: Server['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME);
      ipcService.initialData.onRequest(PopupType.EDIT_NICKNAME, {
        serverId,
        userId,
      });
    };

    const handleLocateUser = () => {
      if (!handleSetCategoryExpanded || !handleSetChannelExpanded) return;
      handleSetCategoryExpanded();
      handleSetChannelExpanded();
    };

    // Effect
    useEffect(() => {
      for (const channel of serverChannels) {
        setExpanded((prev) => ({
          ...prev,
          [channel.id]: true,
        }));
      }
    }, [serverChannels]);

    return (
      <>
        {/* Header */}
        <div className={styles['sidebarHeader']}>
          <div
            className={styles['avatarBox']}
            onClick={() => {
              if (!canOpenServerSettings) return;
              handleOpenServerSetting(userId, serverId);
            }}
          >
            <div
              className={styles['avatarPicture']}
              style={{ backgroundImage: `url(${serverAvatarUrl})` }}
            />
          </div>
          <div className={styles['baseInfoBox']}>
            <div className={styles['container']}>
              <div className={styles['verifyIcon']}></div>
              <div className={styles['name']}>{serverName} </div>
            </div>
            <div className={styles['container']}>
              <div className={styles['idText']}>{serverDisplayId}</div>
              <div className={styles['memberText']}>{serverUsers.length}</div>
            </div>
          </div>
          <div className={styles['optionBox']}>
            <div
              className={styles['invitation']}
              onClick={() => {
                // Handle invite friends
              }}
            />
            <div className={styles['saperator']} />
            <div
              className={styles['setting']}
              onClick={(e) => {
                contextMenu.showContextMenu(
                  e.clientX,
                  e.clientY,
                  [
                    {
                      id: 'invitation',
                      label: lang.tr.invitation,
                      show: canApplyMember,
                      icon: 'memberapply',
                      onClick: () => handleOpenApplyMember(userId, serverId),
                    },
                    // {
                    //   id: 'memberChat',
                    //   label: '會員群聊',
                    //   show: memberPermissionLevel > 2,
                    //   onClick: () => {},
                    // },
                    // {
                    //   id: 'admin',
                    //   label: '查看管理員',
                    //   onClick: () => {},
                    // },
                    {
                      id: 'separator',
                      label: '',
                      show: canApplyMember,
                    },
                    {
                      id: 'editNickname',
                      label: lang.tr.editNickname,
                      icon: 'editGroupcard',
                      show: canEditNickname,
                      onClick: () => handleOpenEditNickname(serverId, userId),
                    },
                    {
                      id: 'locateMe',
                      label: lang.tr.locateMe,
                      icon: 'locateme',
                      onClick: () => handleLocateUser(),
                    },
                    {
                      id: 'separator',
                      label: '',
                    },
                    // {
                    //   id: 'report',
                    //   label: '舉報',
                    //   onClick: () => {},
                    // },
                    // {
                    //   id: 'favorite',
                    //   label: isFavorite ? lang.tr.unfavorite : lang.tr.favorite,
                    //   icon: isFavorite ? 'collect' : 'uncollect',
                    //   onClick: () => handleAddFavoriteServer(serverId),
                    // },
                  ].filter(Boolean) as ContextMenuItem[],
                );
              }}
            />
          </div>
        </div>

        {/* Current Channel */}
        <div className={styles['currentChannelBox']}>
          <div
            className={`${styles['currentChannelIcon']} ${
              styles[`status${connectStatus}`]
            }`}
          />
          <div className={styles['currentChannelText']}>
            {currentChannelName}
          </div>
        </div>

        {/* Mic Queue */}
        {currentChannelVoiceMode === 'queue' && (
          <>
            <div className={styles['sectionTitle']}>{lang.tr.micOrder}</div>
            <div className={styles['micQueueBox']}>
              <div className={styles['userList']}>
                {/* {micQueueUsers.map((user) => (
                    <UserTab
                      key={user.id}
                      user={user}
                      server={server}
                      mainUser={user}
                    />
                  ))} */}
              </div>
            </div>
            <div className={styles['saperator-2']} />
          </>
        )}

        {/* Channel List Title */}
        <div className={styles['sectionTitle']}>
          {view === 'current' ? lang.tr.currentChannel : lang.tr.allChannel}
        </div>

        {/* Channel List */}
        <div
          className={styles['scrollView']}
          onContextMenu={(e) => {
            if (
              !(e.target as HTMLElement).closest(`.${styles['channelTab']}`) &&
              !(e.target as HTMLElement).closest(`.${styles['categoryTab']}`) &&
              !(e.target as HTMLElement).closest(`.${styles['userTab']}`)
            ) {
              contextMenu.showContextMenu(e.pageX, e.pageY, [
                {
                  id: 'addChannel',
                  label: lang.tr.addChannel,
                  show: canCreateChannel,
                  onClick: handleCreateRootChannel,
                },
              ]);
            }
          }}
        >
          <div className={styles['channelList']}>
            {view === 'current' ? (
              <ChannelTab
                key={currentChannel.id}
                user={user}
                server={server}
                member={member}
                channel={currentChannel}
                permissionLevel={memberPermission}
                expanded={{ [currentChannel.id]: true }}
                setExpanded={() => {}}
              />
            ) : (
              serverChannels
                .filter((c) => c.isRoot)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((item) =>
                  item.type === 'category' ? (
                    <CategoryTab
                      key={item.id}
                      user={user}
                      server={server}
                      member={member}
                      category={item}
                      permissionLevel={memberPermission}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ) : (
                    <ChannelTab
                      key={item.id}
                      user={user}
                      server={server}
                      member={member}
                      channel={item}
                      permissionLevel={memberPermission}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ),
                )
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className={styles['bottomNav']}>
          <div
            className={`${styles['navItem']} ${
              view === 'current' ? styles['active'] : ''
            }`}
            onClick={() => setView('current')}
          >
            {lang.tr.currentChannel}
          </div>
          <div
            className={`${styles['navItem']} ${
              view === 'all' ? styles['active'] : ''
            }`}
            onClick={() => setView('all')}
          >
            {lang.tr.allChannel}
          </div>
        </div>
      </>
    );
  },
);

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;
