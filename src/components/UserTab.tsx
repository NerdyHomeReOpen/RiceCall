import React, { useEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Server, User, OnlineMember, Friend, Category, QueueUser } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

// Services
import ipc from '@/services/ipc.service';

// Utils
import {
  handleOpenAlertDialog,
  handleOpenDirectMessage,
  handleOpenUserInfo,
  handleOpenEditNickname,
  handleOpenApplyFriend,
  handleOpenBlockMember,
  handleOpenKickMemberFromServer,
  handleOpenKickMemberFromChannel,
  handleOpenInviteMember,
} from '@/utils/popup';
import { isMember, isServerAdmin, isServerOwner, isChannelMod, isChannelAdmin } from '@/utils/permission';

interface UserTabProps {
  user: User;
  currentServer: Server;
  currentChannel: Channel;
  friends: Friend[];
  queueUsers: QueueUser[];
  channel: Channel | Category;
  member: OnlineMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  handleConnectChannel: (serverId: Server['serverId'], channelId: Channel['channelId']) => void;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ user, currentServer, currentChannel, friends, queueUsers, channel, member, selectedItemId, setSelectedItemId, handleConnectChannel }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();
  const findMe = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const { channelId, categoryId: channelCategoryId, voiceMode: channelVoiceMode } = channel;
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    xp: memberXp,
    requiredXp: memberRequiredXp,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: isMemberTextMuted,
    isVoiceMuted: isMemberVoiceMuted,
    currentChannelId: memberCurrentChannelId,
    currentServerId: memberCurrentServerId,
  } = member;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isUser = memberUserId === userId;
  const isUserInQueue = useMemo(() => queueUsers.some((qu) => qu.userId === memberUserId), [queueUsers, memberUserId]);
  const isSameChannel = memberCurrentChannelId === currentChannelId;
  const isSpeaking = isUser ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
  const isMuted = isUser ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = permissionLevel >= memberPermission;
  const canUpdatePermission = !isUser && isSuperior && isMember(memberPermission);

  // Handlers
  const getStatusIcon = () => {
    if (isMuted || isMemberVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const getContextMenuItems = () => [
    {
      id: 'join-user-channel',
      label: t('join-user-channel'),
      show: !isUser && !isSameChannel,
      onClick: () => handleConnectChannel(currentServerId, channelId),
    },
    {
      id: 'add-to-queue',
      label: t('add-to-queue'),
      disabled: isUserInQueue,
      show: !isUser && isChannelMod(permissionLevel) && isSuperior && isSameChannel && channelVoiceMode === 'queue',
      onClick: () => handleAddUserToQueue(memberUserId, currentServerId, channelId),
    },
    {
      id: 'direct-message',
      label: t('direct-message'),
      show: !isUser,
      onClick: () => handleOpenDirectMessage(userId, memberUserId),
    },
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => handleOpenUserInfo(userId, memberUserId),
    },
    {
      id: 'add-friend',
      label: t('add-friend'),
      show: !isUser && !isFriend,
      onClick: () => handleOpenApplyFriend(userId, memberUserId),
    },
    {
      id: 'set-mute',
      label: isMuted ? t('unmute') : t('mute'),
      show: !isUser,
      onClick: () => (isMuted ? handleUnmuteUser(memberUserId) : handleMuteUser(memberUserId)),
    },
    {
      id: 'edit-nickname',
      label: t('edit-nickname'),
      show: isMember(memberPermission) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
      onClick: () => handleOpenEditNickname(memberUserId, currentServerId),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'move-to-channel',
      label: t('move-to-channel'),
      show: !isUser && isChannelMod(currentPermissionLevel) && isChannelMod(permissionLevel) && !isSameChannel && isSuperior,
      onClick: () => handleMoveUserToChannel(memberUserId, currentServerId, currentChannelId),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'forbid-voice',
      label: isMemberVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserVoiceInChannel(memberUserId, currentServerId, channelId, !isMemberVoiceMuted),
    },
    {
      id: 'forbid-text',
      label: isMemberTextMuted ? t('unforbid-text') : t('forbid-text'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserTextInChannel(memberUserId, currentServerId, channelId, !isMemberTextMuted),
    },
    {
      id: 'kick-channel',
      label: t('kick-channel'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior && memberCurrentChannelId !== currentServerLobbyId,
      onClick: () => handleOpenKickMemberFromChannel(memberUserId, currentServerId, channelId),
    },
    {
      id: 'kick-server',
      label: t('kick-server'),
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior && memberCurrentServerId === currentServerId,
      onClick: () => handleOpenKickMemberFromServer(memberUserId, currentServerId),
    },
    {
      id: 'block',
      label: t('block'),
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
      onClick: () => handleOpenBlockMember(memberUserId, currentServerId),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'terminate-self-membership',
      label: t('terminate-self-membership'),
      show: isUser && isMember(permissionLevel) && !isServerOwner(permissionLevel),
      onClick: () => handleTerminateMember(userId, currentServerId, t('self')),
    },
    {
      id: 'invite-to-be-member',
      label: t('invite-to-be-member'),
      show: !isUser && !isMember(memberPermission) && isServerAdmin(permissionLevel),
      onClick: () => handleOpenInviteMember(memberUserId, currentServerId),
    },
    {
      id: 'member-management',
      label: t('member-management'),
      show: canUpdatePermission && (channelCategoryId === null ? isServerAdmin(permissionLevel) : isChannelAdmin(permissionLevel)),
      icon: 'submenu',
      hasSubmenu: true,
      submenuItems: [
        {
          id: 'terminate-member',
          label: t('terminate-member'),
          show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(memberPermission) && !isServerOwner(memberPermission),
          onClick: () => handleTerminateMember(memberUserId, currentServerId, memberName),
        },
        {
          id: 'set-channel-mod',
          label: isChannelMod(memberPermission) ? t('unset-channel-mod') : t('set-channel-mod'),
          show: canUpdatePermission && isChannelAdmin(permissionLevel) && !isChannelAdmin(memberPermission) && channelCategoryId !== null,
          onClick: () =>
            isChannelMod(memberPermission)
              ? handleEditChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 2 })
              : handleEditChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 3 }),
        },
        {
          id: 'set-channel-admin',
          label: isChannelAdmin(memberPermission) ? t('unset-channel-admin') : t('set-channel-admin'),
          show: canUpdatePermission && isServerAdmin(permissionLevel) && !isServerAdmin(memberPermission),
          onClick: () =>
            isChannelAdmin(memberPermission)
              ? handleEditChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 2 })
              : handleEditChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 4 }),
        },
        {
          id: 'set-server-admin',
          label: isServerAdmin(memberPermission) ? t('unset-server-admin') : t('set-server-admin'),
          show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(memberPermission),
          onClick: () =>
            isServerAdmin(memberPermission)
              ? handleEditServerPermission(memberUserId, currentServerId, { permissionLevel: 2 })
              : handleEditServerPermission(memberUserId, currentServerId, { permissionLevel: 5 }),
        },
      ],
    },
  ];

  const handleMuteUser = (userId: User['userId']) => {
    webRTC.muteUser(userId);
  };

  const handleUnmuteUser = (userId: User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleMoveUserToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-move-members-to-channel', { '0': 1 }), () => ipc.socket.send('moveUserToChannel', { userId, serverId, channelId }));
  };

  const handleAddUserToQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('addUserToQueue', { userId, serverId, channelId });
  };

  const handleForbidUserTextInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleForbidUserVoiceInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  const handleDragStart = (e: React.DragEvent, userId: User['userId'], channelId: Channel['channelId']) => {
    e.dataTransfer.setData('type', 'moveUser');
    e.dataTransfer.setData('userId', userId);
    e.dataTransfer.setData('currentChannelId', channelId);
  };

  // Effects
  useEffect(() => {
    if (!findMe || !isUser) return;
    findMe.userTabRef.current = userTabRef.current;
  }, [findMe, isUser]);

  return (
    <div
      ref={userTabRef}
      className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `user-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `user-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`user-${memberUserId}`);
      }}
      onDoubleClick={() => {
        if (isUser) return;
        handleOpenDirectMessage(userId, memberUserId);
      }}
      onMouseEnter={(e) => {
        const x = e.currentTarget.getBoundingClientRect().right;
        const y = e.currentTarget.getBoundingClientRect().top;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          contextMenu.showUserInfoBlock(x, y, 'right-bottom', member);
        }, 200);
      }}
      onMouseLeave={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
      draggable={!isUser && isChannelMod(permissionLevel) && permissionLevel >= memberPermission}
      onDragStart={(e) => handleDragStart(e, memberUserId, channelId)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={`${styles['user-text-state']} ${isMemberTextMuted ? styles['muted'] : ''}`} />
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <LevelIcon level={memberLevel} xp={memberXp} requiredXp={memberRequiredXp} />
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
