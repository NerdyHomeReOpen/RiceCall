import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface UserTabProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueUsers: Types.QueueUser[];
  channel: Types.Channel | Types.Category;
  member: Types.OnlineMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  handleConnectChannel: (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => void;
  displayUserPicture?: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, currentServer, currentChannel, friends, queueUsers, channel, member, selectedItemId, setSelectedItemId, handleConnectChannel, displayUserPicture = false }) => {
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
      avatarUrl: memberAvatarUrl,
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
    const isSelf = memberUserId === userId;
    const isInSameServer = memberCurrentServerId === currentServerId;
    const isInSameChannel = memberCurrentChannelId === currentChannelId;
    const isInLobby = memberCurrentChannelId === currentServerLobbyId;
    const isInQueue = useMemo(() => queueUsers.some((qu) => qu.userId === memberUserId), [queueUsers, memberUserId]);
    const isSpeaking = isSelf ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
    const isMuted = isSelf ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
    const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
    const isSuperior = permissionLevel > memberPermission;
    const isEqualOrSuperior = permissionLevel >= memberPermission;
    const channelIsQueueMode = channelVoiceMode === 'queue';

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
        show: !isSelf && !isInSameChannel,
        onClick: () => handleConnectChannel(currentServerId, channelId),
      },
      {
        id: 'add-to-queue',
        label: t('add-to-queue'),
        disabled: isInQueue,
        show: !isSelf && isEqualOrSuperior && channelIsQueueMode && Permission.isChannelMod(permissionLevel),
        onClick: () => handleAddUserToQueue(memberUserId, currentServerId, channelId),
      },
      {
        id: 'direct-message',
        label: t('direct-message'),
        show: !isSelf,
        onClick: () => Popup.handleOpenDirectMessage(userId, memberUserId),
      },
      {
        id: 'view-profile',
        label: t('view-profile'),
        onClick: () => Popup.handleOpenUserInfo(userId, memberUserId),
      },
      {
        id: 'add-friend',
        label: t('add-friend'),
        show: !isSelf && !isFriend,
        onClick: () => Popup.handleOpenApplyFriend(userId, memberUserId),
      },
      {
        id: 'set-mute',
        label: isMuted ? t('unmute') : t('mute'),
        show: !isSelf,
        onClick: () => (isMuted ? handleUnmuteUser(memberUserId) : handleMuteUser(memberUserId)),
      },
      {
        id: 'edit-nickname',
        label: t('edit-nickname'),
        show: (isSelf || (Permission.isServerAdmin(permissionLevel) && isSuperior)) && Permission.isMember(memberPermission),
        onClick: () => Popup.handleOpenEditNickname(memberUserId, currentServerId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'move-to-channel',
        label: t('move-to-channel'),
        show: !isSelf && !isInSameChannel && isEqualOrSuperior && Permission.isChannelMod(currentPermissionLevel) && Permission.isChannelMod(permissionLevel),
        onClick: () => handleMoveUserToChannel(memberUserId, currentServerId, currentChannelId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'forbid-voice',
        label: isMemberVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
        show: !isSelf && isSuperior && Permission.isChannelMod(permissionLevel),
        onClick: () => handleForbidUserVoiceInChannel(memberUserId, currentServerId, channelId, !isMemberVoiceMuted),
      },
      {
        id: 'forbid-text',
        label: isMemberTextMuted ? t('unforbid-text') : t('forbid-text'),
        show: !isSelf && isSuperior && Permission.isChannelMod(permissionLevel),
        onClick: () => handleForbidUserTextInChannel(memberUserId, currentServerId, channelId, !isMemberTextMuted),
      },
      {
        id: 'kick-channel',
        label: t('kick-channel'),
        show: !isSelf && isSuperior && !isInLobby && Permission.isChannelMod(permissionLevel),
        onClick: () => Popup.handleOpenKickMemberFromChannel(memberUserId, currentServerId, channelId),
      },
      {
        id: 'kick-server',
        label: t('kick-server'),
        show: !isSelf && isSuperior && isInSameServer && Permission.isServerAdmin(permissionLevel),
        onClick: () => Popup.handleOpenKickMemberFromServer(memberUserId, currentServerId),
      },
      {
        id: 'block',
        label: t('block'),
        show: !isSelf && isSuperior && Permission.isServerAdmin(permissionLevel),
        onClick: () => Popup.handleOpenBlockMember(memberUserId, currentServerId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'terminate-self-membership',
        label: t('terminate-self-membership'),
        show: isSelf && Permission.isMember(permissionLevel) && !Permission.isServerOwner(permissionLevel),
        onClick: () => handleTerminateMember(userId, currentServerId, t('self')),
      },
      {
        id: 'invite-to-be-member',
        label: t('invite-to-be-member'),
        show: !isSelf && !Permission.isMember(memberPermission) && Permission.isServerAdmin(permissionLevel),
        onClick: () => Popup.handleOpenInviteMember(memberUserId, currentServerId),
      },
      {
        id: 'member-management',
        label: t('member-management'),
        show: !isSelf && isSuperior && Permission.isMember(memberPermission) && (!!channelCategoryId ? Permission.isChannelAdmin(permissionLevel) : Permission.isServerAdmin(permissionLevel)),
        icon: 'submenu',
        hasSubmenu: true,
        submenuItems: [
          {
            id: 'terminate-member',
            label: t('terminate-member'),
            show: !isSelf && isSuperior && Permission.isMember(memberPermission) && !Permission.isServerOwner(memberPermission) && Permission.isServerAdmin(permissionLevel),
            onClick: () => handleTerminateMember(memberUserId, currentServerId, memberName),
          },
          {
            id: 'set-channel-mod',
            label: Permission.isChannelMod(memberPermission) ? t('unset-channel-mod') : t('set-channel-mod'),
            show: !!channelCategoryId && Permission.isChannelAdmin(permissionLevel) && !Permission.isChannelAdmin(memberPermission),
            onClick: () =>
              Permission.isChannelMod(memberPermission)
                ? handleEditChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 2 })
                : handleEditChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 3 }),
          },
          {
            id: 'set-channel-admin',
            label: Permission.isChannelAdmin(memberPermission) ? t('unset-channel-admin') : t('set-channel-admin'),
            show: Permission.isServerAdmin(permissionLevel) && !Permission.isServerAdmin(memberPermission),
            onClick: () =>
              Permission.isChannelAdmin(memberPermission)
                ? handleEditChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 2 })
                : handleEditChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 4 }),
          },
          {
            id: 'set-server-admin',
            label: Permission.isServerAdmin(memberPermission) ? t('unset-server-admin') : t('set-server-admin'),
            show: Permission.isServerOwner(permissionLevel) && !Permission.isServerOwner(memberPermission),
            onClick: () =>
              Permission.isServerAdmin(memberPermission)
                ? handleEditServerPermission(memberUserId, currentServerId, { permissionLevel: 2 })
                : handleEditServerPermission(memberUserId, currentServerId, { permissionLevel: 5 }),
          },
        ],
      },
    ];

    const handleMuteUser = (userId: Types.User['userId']) => {
      webRTC.muteUser(userId);
    };

    const handleUnmuteUser = (userId: Types.User['userId']) => {
      webRTC.unmuteUser(userId);
    };

    const handleEditServerPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
      ipc.socket.send('editServerPermission', { userId, serverId, update });
    };

    const handleEditChannelPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) => {
      ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
    };

    const handleMoveUserToChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      ipc.socket.send('moveUserToChannel', { userId, serverId, channelId });
    };

    const handleAddUserToQueue = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      ipc.socket.send('addUserToQueue', { userId, serverId, channelId });
    };

    const handleForbidUserTextInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isTextMuted: boolean) => {
      ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
    };

    const handleForbidUserVoiceInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isVoiceMuted: boolean) => {
      ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
    };

    const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
      Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
    };

    const handleDragStart = (e: React.DragEvent, userId: Types.User['userId'], channelId: Types.Channel['channelId']) => {
      e.dataTransfer.setData('type', 'moveUser');
      e.dataTransfer.setData('userId', userId);
      e.dataTransfer.setData('currentChannelId', channelId);
    };

    // Effects
    useEffect(() => {
      if (!findMe || !isSelf) return;
      findMe.userTabRef.current = userTabRef.current;
    }, [findMe, isSelf]);

    return (
      <div
        ref={userTabRef}
        className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `user-${memberUserId}` ? styles['selected'] : ''}`}
        onClick={() => {
          if (selectedItemId === `user-${memberUserId}`) setSelectedItemId(null);
          else setSelectedItemId(`user-${memberUserId}`);
        }}
        onDoubleClick={() => {
          if (isSelf) return;
          Popup.handleOpenDirectMessage(userId, memberUserId);
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
        draggable={!isSelf && isSuperior && Permission.isChannelMod(permissionLevel)}
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
        {displayUserPicture && <div className={styles['user-tab-avatar-picture']} style={{ backgroundImage: `url(${memberAvatarUrl})` }} />}
        {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
        <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
        <LevelIcon level={memberLevel} xp={memberXp} requiredXp={memberRequiredXp} showTooltip={false} />
        <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        {isSelf && <div className={styles['my-location-icon']} />}
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

export default UserTab;
