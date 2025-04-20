import React, { useState, useEffect } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

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
  Permission,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useExpandedContext } from '@/providers/Expanded';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Services
import ipcService from '@/services/ipc.service';

interface CategoryTabProps {
  userId: User['userId'];
  currentChannelId: Channel['channelId'];
  serverId: Server['serverId'];
  serverActiveMembers: ServerMember[];
  serverChannels: (Channel | Category)[];
  category: Category;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({
    userId,
    currentChannelId,
    serverId,
    serverActiveMembers,
    serverChannels,
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
    const {
      channelId: categoryId,
      name: categoryName,
      visibility: categoryVisibility,
    } = category;
    const categoryChannels = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === categoryId);
    const userInCategory = categoryChannels.some(
      (ch) => ch.channelId === currentChannelId,
    );
    const canCreateChannel = permissionLevel > 4;
    const canDeleteCategory = permissionLevel > 4;
    const canOpenCategorySettings = permissionLevel > 4;

    // Handlers
    const handleOpenChannelSetting = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING);
      ipcService.initialData.onRequest(PopupType.CHANNEL_SETTING, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['serverId'],
      categoryId: Category['categoryId'],
      userId: User['userId'],
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
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleOpenChangeChannelOrder = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL_ORDER);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL_ORDER, {
        serverId,
        userId,
      });
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
                onClick: () => {
                  if (!categoryName) return;
                  handleOpenWarning(
                    lang.tr.warningDeleteChannel.replace('{0}', categoryName),
                  );
                },
              },
              {
                id: 'changeChannelOrder',
                label: lang.tr.editChannelOrder,
                show: canCreateChannel,
                onClick: () => handleOpenChangeChannelOrder(userId, serverId),
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
        <div
          className={styles['channelList']}
          style={{
            display: expanded[categoryId] ? 'block' : 'none',
          }}
        >
          {categoryChannels
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((channel) => (
              <ChannelTab
                key={channel.channelId}
                userId={userId}
                currentChannelId={currentChannelId}
                serverId={serverId}
                serverActiveMembers={serverActiveMembers}
                channel={channel}
                permissionLevel={permissionLevel}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            ))}
        </div>
      </>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  userId: User['userId'];
  currentChannelId: Channel['channelId'];
  serverId: Server['serverId'];
  serverActiveMembers: ServerMember[];
  channel: Channel;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({
    userId,
    currentChannelId,
    serverId,
    serverActiveMembers,
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
    const {
      channelId,
      name: channelName,
      isLobby: channelIsLobby,
      visibility: channelVisibility,
      userLimit: channelUserLimit,
      categoryId: channelCategoryId,
    } = channel;
    const channelMembers = serverActiveMembers.filter(
      (mb) => mb.currentChannelId === channelId,
    );
    const userInChannel = currentChannelId === channelId;
    const canJoin =
      !userInChannel &&
      channelVisibility !== 'readonly' &&
      !(channelVisibility === 'private' && permissionLevel < 3) &&
      !(channelVisibility === 'member' && permissionLevel < 2) &&
      (channelUserLimit === 0 ||
        channelUserLimit > channelMembers.length ||
        permissionLevel > 4);
    const canCreateChannel =
      permissionLevel > 4 && !channelIsLobby && !channelCategoryId;
    const canDeleteChannel = permissionLevel > 4 && !channelIsLobby;
    const canOpenChannelSettings = permissionLevel > 4;

    // Handlers
    const handleOpenChannelSetting = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING);
      ipcService.initialData.onRequest(PopupType.CHANNEL_SETTING, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['serverId'],
      channelId: Channel['channelId'] | null,
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        channelId,
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
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleJoinChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId });
    };

    const handleOpenEditChannelOrder = () => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL_ORDER);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL_ORDER, {
        serverId,
        categoryId: null,
        userId,
      });
    };

    const handleOpenChannelPassword = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_PASSWORD);
      ipcService.initialData.onRequest(PopupType.CHANNEL_PASSWORD, {
        userId,
        serverId,
        channelId,
      });
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
            if (!userInChannel && channel.password && permissionLevel < 3) {
              handleOpenChannelPassword(userId, serverId, channelId);
            } else if (canJoin) {
              handleJoinChannel(userId, serverId, channelId);
            }
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
                onClick: () => {
                  if (!channelName) return;
                  handleOpenWarning(
                    lang.tr.warningDeleteChannel.replace('{0}', channelName),
                  );
                },
              },
              {
                id: 'editChannelOrder',
                label: lang.tr.editChannelOrder,
                show: permissionLevel > 4,
                onClick: handleOpenEditChannelOrder,
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
          <div
            className={`${channelIsLobby ? styles['isLobby'] : ''} ${
              styles['channelTabLable']
            }`}
          >
            {channelName}
          </div>
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
        <div
          className={styles['userList']}
          style={{
            display: expanded[channelId] ? 'block' : 'none',
          }}
        >
          {channelMembers
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((channelMember) => (
              <UserTab
                key={channelMember.userId}
                userId={userId}
                channelMember={channelMember}
                permissionLevel={permissionLevel}
              />
            ))}
        </div>
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

interface UserTabProps {
  userId: User['userId'];
  channelMember: ServerMember;
  permissionLevel: number;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ userId, channelMember, permissionLevel }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const socket = useSocket();
    const webRTC = useWebRTC();

    // Variables
    const {
      userId: channelMemberUserId,
      serverId: channelMemberServerId,
      name: channelMemberName,
      permissionLevel: channelMemberPermission,
      nickname: channelMemberNickname,
      level: channelMemberLevel,
      gender: channelMemberGender,
      badges: channelMemberBadges,
      vip: channelMemberVip,
    } = channelMember;
    const channelMemberGrade = Math.min(56, channelMemberLevel); // 56 is max leve
    const isCurrentUser = userId === channelMemberUserId;

    const canManageMember =
      !isCurrentUser &&
      permissionLevel > channelMemberPermission &&
      permissionLevel > 3 &&
      channelMemberPermission > 1;
    const canEditNickname =
      (isCurrentUser && permissionLevel > 1) || canManageMember;
    const canChangeToGuest =
      !isCurrentUser &&
      permissionLevel > channelMemberPermission &&
      permissionLevel > 4 &&
      channelMemberPermission !== 1;
    const canChangeToMember =
      permissionLevel > 2 && channelMemberPermission !== 2;
    const canChangeToChannelAdmin =
      permissionLevel > 3 && channelMemberPermission !== 3;
    const canChangeToCategoryAdmin =
      permissionLevel > 4 && channelMemberPermission !== 4;
    const canChangeToAdmin =
      permissionLevel > 5 && channelMemberPermission !== 5;
    const speakingStatus =
      webRTC.speakStatus?.[channelMemberUserId] ||
      (isCurrentUser && webRTC.volumePercent) ||
      0;
    const isSpeaking = speakingStatus !== 0;
    const isMuted = speakingStatus === -1;
    const isMutedByUser = webRTC.muteList.includes(channelMemberUserId);
    const canKick =
      permissionLevel > 4 &&
      !isCurrentUser &&
      channelMemberPermission < permissionLevel;

    // Handlers
    const handleOpenEditNickname = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME);
      ipcService.initialData.onRequest(PopupType.EDIT_NICKNAME, {
        serverId,
        userId,
      });
    };

    const handleOpenApplyFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(PopupType.DIRECT_MESSAGE);
      ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
        userId,
        targetId,
        targetName,
      });
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

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({
        member,
        userId,
        serverId,
      });
    };

    const handleKickUser = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.disconnectServer({ userId, serverId });
    };

    const removeLevelToMember = (label: string, currentLevel: Permission) => ({
      id: 'set-member',
      label,
      show: channelMemberPermission === currentLevel && canChangeToMember,
      onClick: () =>
        handleUpdateMember(
          { permissionLevel: 2 },
          channelMemberUserId,
          channelMemberServerId,
        ),
    });

    return (
      <div
        key={channelMemberUserId}
        className={`${styles['userTab']}`}
        onClick={(e) => {
          contextMenu.showUserInfoBlock(e.pageX, e.pageY, channelMember);
        }}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'direct-message',
              label: lang.tr.directMessage,
              onClick: () =>
                handleOpenDirectMessage(
                  userId,
                  channelMemberUserId,
                  channelMemberName,
                ),
              show: !isCurrentUser,
            },
            {
              id: 'view-profile',
              label: lang.tr.viewProfile,
              onClick: () => handleOpenUserInfo(userId, channelMemberUserId),
            },
            {
              id: 'apply-friend',
              label: lang.tr.addFriend,
              onClick: () => handleOpenApplyFriend(userId, channelMemberUserId),
              show: !isCurrentUser,
            },
            {
              id: 'mute',
              label: lang.tr.mute,
              onClick: () => webRTC.handleMute(channelMemberUserId),
              show: !isMutedByUser && !isCurrentUser,
            },
            {
              id: 'unmute',
              label: lang.tr.unmute,
              onClick: () => webRTC.handleUnmute(channelMemberUserId),
              show: isMutedByUser && !isCurrentUser,
            },
            {
              id: 'edit-nickname',
              label: lang.tr.editNickname,
              onClick: () =>
                handleOpenEditNickname(
                  channelMemberUserId,
                  channelMemberServerId,
                ),
              show: canEditNickname,
            },
            {
              id: 'separator',
              label: '',
              show: canManageMember,
            },
            {
              id: 'kick',
              label: lang.tr.kick,
              show: canKick,
              onClick: () =>
                handleKickUser(channelMemberUserId, channelMemberServerId),
            },
            {
              id: 'member-management',
              label: lang.tr.memberManagement,
              show: canManageMember,
              icon: 'submenu',
              hasSubmenu: true,
              submenuItems: [
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
                removeLevelToMember(lang.tr.removeChannelAdmin, 3),

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
                removeLevelToMember(lang.tr.removeCategoryAdmin, 4),

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
                removeLevelToMember(lang.tr.removeAdmin, 5),
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
              ],
            },
          ]);
        }}
      >
        <div
          className={`
            ${styles['userState']} 
            ${isSpeaking && !isMuted ? styles['play'] : ''} 
            ${!isSpeaking && isMuted ? styles['muted'] : ''} 
            ${isMutedByUser ? styles['muted'] : ''}
          `}
        />
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
            ${channelMemberVip > 0 ? styles['isVIP'] : ''}
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
        <BadgeViewer badges={channelMemberBadges} maxDisplay={5} />
        {isCurrentUser && <div className={styles['myLocationIcon']} />}
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

interface ChannelViewerProps {
  user: User;
  server: Server;
  currentChannel: Channel;
  serverChannels: (Channel | Category)[];
  serverActiveMembers: ServerMember[];
  permissionLevel: Member['permissionLevel'];
}

const ChannelViewer: React.FC<ChannelViewerProps> = React.memo(
  ({
    user,
    server,
    currentChannel,
    serverChannels,
    serverActiveMembers,
    permissionLevel,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { handleSetCategoryExpanded, handleSetChannelExpanded } =
      useExpandedContext();

    // States
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<'all' | 'current'>('all');
    const [latency, setLatency] = useState<string>('0');

    // Variables
    const connectStatus = 4 - Math.floor(Number(latency) / 50);
    const { userId } = user;
    const {
      serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
      receiveApply: serverReceiveApply,
    } = server;
    const {
      channelId: currentChannelId,
      name: currentChannelName,
      voiceMode: currentChannelVoiceMode,
    } = currentChannel;
    const canCreateChannel = permissionLevel > 4;
    const canEditNickname = permissionLevel > 1;
    const canApplyMember = permissionLevel < 2;
    const canOpenServerSettings = permissionLevel > 4;

    const handleCreateRootChannel = () => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId: null,
        userId,
      });
    };

    const handleOpenServerSetting = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.SERVER_SETTING);
      ipcService.initialData.onRequest(PopupType.SERVER_SETTING, {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!serverReceiveApply) {
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
      userId: User['userId'],
      serverId: Server['serverId'],
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
          [channel.channelId]:
            prev[channel.channelId] != undefined
              ? prev[channel.channelId]
              : true,
        }));
      }
    }, [serverChannels]);

    useEffect(() => {
      if (!socket) return;
      let start = Date.now();
      let end = Date.now();
      socket.send.ping(null);
      const measure = setInterval(() => {
        start = Date.now();
        socket.send.ping(null);
      }, 10000);
      const clearPong = socket.on.pong(() => {
        end = Date.now();
        setLatency((end - start).toFixed(0));
      });
      return () => {
        clearInterval(measure);
        clearPong();
      };
    }, [socket]);

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
              <div className={styles['memberText']}>
                {serverActiveMembers.length}
              </div>
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
                      onClick: () => handleOpenEditNickname(userId, serverId),
                    },
                    {
                      id: 'locateMe',
                      label: lang.tr.locateMe,
                      icon: 'locateme',
                      onClick: () => handleLocateUser(),
                    },
                    // {
                    //   id: 'separator',
                    //   label: '',
                    // },
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
            className={`
              ${styles['currentChannelIcon']} 
              ${styles[`status${connectStatus}`]}
            `}
          >
            <div
              className={`${styles['currentChannelPing']}`}
            >{`${latency}ms`}</div>
          </div>
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
                key={currentChannelId}
                userId={userId}
                currentChannelId={currentChannelId}
                serverId={serverId}
                serverActiveMembers={serverActiveMembers}
                channel={currentChannel}
                permissionLevel={permissionLevel}
                expanded={{ [currentChannelId]: true }}
                setExpanded={() => {}}
              />
            ) : (
              serverChannels
                .filter((c) => !c.categoryId)
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                )
                .map((item) =>
                  item.type === 'category' ? (
                    <CategoryTab
                      key={item.channelId}
                      userId={userId}
                      currentChannelId={currentChannelId}
                      serverId={serverId}
                      serverActiveMembers={serverActiveMembers}
                      serverChannels={serverChannels}
                      category={item}
                      permissionLevel={permissionLevel}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ) : (
                    <ChannelTab
                      key={item.channelId}
                      userId={userId}
                      currentChannelId={currentChannelId}
                      serverId={serverId}
                      serverActiveMembers={serverActiveMembers}
                      channel={item}
                      permissionLevel={permissionLevel}
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
            className={`
              ${styles['navItem']} 
              ${view === 'current' ? styles['active'] : ''}
            `}
            onClick={() => setView('current')}
          >
            {lang.tr.currentChannel}
          </div>
          <div
            className={`
              ${styles['navItem']} 
              ${view === 'all' ? styles['active'] : ''}
            `}
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
