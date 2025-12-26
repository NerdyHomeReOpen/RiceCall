import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface QueueUserTabProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueMember: Types.QueueMember;
  queueMembers: Types.QueueMember[];
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ user, currentServer, currentChannel, friends, queueMember, queueMembers, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();

  // Refs
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId } = currentServer;
  const { channelId: currentChannelId, categoryId: currentChannelCategoryId } = currentChannel;
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: isMemberTextMuted,
    isVoiceMuted: isMemberVoiceMuted,
    currentChannelId: memberCurrentChannelId,
    currentServerId: memberCurrentServerId,
    position: memberPosition,
    leftTime: memberLeftTime,
    isQueueControlled,
  } = queueMember;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = memberUserId === userId;
  const isInSameServer = memberCurrentServerId === currentServerId;
  const isInLobby = memberCurrentChannelId === currentServerLobbyId;
  const isSpeaking = isSelf ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
  const isMuted = isSelf ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
  const isControlled = memberPosition === 0 && isQueueControlled && !Permission.isChannelMod(memberPermission);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = permissionLevel > memberPermission;

  // Handlers
  const getStatusIcon = () => {
    if (isMuted || isMemberVoiceMuted || isControlled) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const getContextMenuItems = () => [
    {
      id: 'increase-queue-time',
      label: t('increase-queue-time'),
      show: memberPosition === 0 && Permission.isChannelMod(permissionLevel),
      onClick: () => handleIncreaseUserQueueTime(memberUserId, currentServerId, currentChannelId),
    },
    {
      id: 'move-up-queue',
      label: t('move-up-queue'),
      show: memberPosition > 1 && Permission.isChannelMod(permissionLevel),
      onClick: () => handleMoveUserQueuePositionUp(memberUserId, currentServerId, currentChannelId, memberPosition - 1),
    },
    {
      id: 'move-down-queue',
      label: t('move-down-queue'),
      show: memberPosition > 0 && memberPosition < queueMembers.length - 1 && Permission.isChannelMod(permissionLevel),
      onClick: () => handleMoveUserQueuePositionDown(memberUserId, currentServerId, currentChannelId, memberPosition + 1),
    },
    {
      id: 'remove-from-queue',
      label: t('remove-from-queue'),
      show: Permission.isChannelMod(permissionLevel),
      onClick: () => handleRemoveUserFromQueue(memberUserId, currentServerId, currentChannelId),
    },
    {
      id: 'clear-queue',
      label: t('clear-queue'),
      show: Permission.isChannelMod(permissionLevel),
      onClick: () => handleClearQueue(currentServerId, currentChannelId),
    },
    {
      id: 'separator',
      label: '',
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
      id: 'forbid-voice',
      label: isMemberVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
      show: !isSelf && Permission.isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserVoiceInChannel(memberUserId, currentServerId, currentChannelId, !isMemberVoiceMuted),
    },
    {
      id: 'forbid-text',
      label: isMemberTextMuted ? t('unforbid-text') : t('forbid-text'),
      show: !isSelf && Permission.isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserTextInChannel(memberUserId, currentServerId, currentChannelId, !isMemberTextMuted),
    },
    {
      id: 'kick-channel',
      label: t('kick-channel'),
      show: !isSelf && isSuperior && !isInLobby && Permission.isChannelMod(permissionLevel),
      onClick: () => handleBlockUserFromChannel(memberUserId, currentChannelId, currentServerId, memberNickname || memberName),
    },
    {
      id: 'kick-server',
      label: t('kick-server'),
      show: !isSelf && isSuperior && isInSameServer && Permission.isServerAdmin(permissionLevel),
      onClick: () => handleBlockUserFromServer(memberUserId, currentServerId, memberNickname || memberName),
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
      show: !isSelf && isSuperior && Permission.isMember(memberPermission),
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
          show: !!currentChannelCategoryId && Permission.isChannelAdmin(permissionLevel) && !Permission.isChannelAdmin(memberPermission),
          onClick: () =>
            Permission.isChannelMod(memberPermission)
              ? handleEditChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
        },
        {
          id: 'set-channel-admin',
          label: Permission.isChannelAdmin(memberPermission) ? t('unset-channel-admin') : t('set-channel-admin'),
          show: Permission.isServerAdmin(permissionLevel) && !Permission.isServerAdmin(memberPermission),
          onClick: () =>
            Permission.isChannelAdmin(memberPermission)
              ? handleEditChannelPermission(memberUserId, currentServerId, currentChannelCategoryId || currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(memberUserId, currentServerId, currentChannelCategoryId || currentChannelId, { permissionLevel: 4 }),
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

  const handleForbidUserTextInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleForbidUserVoiceInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
  };

  const handleIncreaseUserQueueTime = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
    ipc.socket.send('increaseUserQueueTime', { serverId, channelId, userId });
  };

  const handleMoveUserQueuePositionDown = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleMoveUserQueuePositionUp = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleRemoveUserFromQueue = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
    Popup.handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberNickname || memberName }), () => ipc.socket.send('removeUserFromQueue', { serverId, channelId, userId }));
  };

  const handleClearQueue = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
    Popup.handleOpenAlertDialog(t('confirm-clear-queue'), () => ipc.socket.send('clearQueue', { serverId, channelId }));
  };

  const handleBlockUserFromServer = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromServer', { userId, serverId }));
  };

  const handleBlockUserFromChannel = (userId: Types.User['userId'], channelId: Types.Channel['channelId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId }));
  };

  const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  return (
    <div
      className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `queue-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `queue-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`queue-${memberUserId}`);
      }}
      onMouseEnter={(e) => {
        const x = e.currentTarget.getBoundingClientRect().right;
        const y = e.currentTarget.getBoundingClientRect().top;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          contextMenu.showUserInfoBlock(x, y, 'right-bottom', queueMember);
        }, 200);
      }}
      onMouseLeave={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      <div className={`${styles['user-queue-position']}`}>{memberPosition + 1}.</div>
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;
