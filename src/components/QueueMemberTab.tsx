import React, { useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { User, QueueUser, Channel, Server, Permission, Friend, OnlineMember } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeList from '@/components/BadgeList';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { isMember, isChannelMod, isChannelAdmin, isServerAdmin, isServerOwner } from '@/utils/permission';

interface QueueMemberTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  channel: Channel;
  queueMember: QueueUser & OnlineMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const QueueMemberTab: React.FC<QueueMemberTabProps> = React.memo(({ user, friends, server, channel, queueMember, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();

  // Refs
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Destructuring
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: memberIsTextMuted,
    isVoiceMuted: memberIsVoiceMuted,
    currentServerId: memberCurrentServerId,
    currentChannelId: memberCurrentChannelId,
    position: memberPosition,
    leftTime: memberLeftTime,
    isQueueControlled: memberIsQueueControlled,
  } = queueMember;
  const { userId, permissionLevel: globalPermission } = user;
  const { serverId, lobbyId: serverLobbyId, permissionLevel: serverPermission } = server;
  const { channelId, categoryId: channelCategoryId, permissionLevel: channelPermission } = channel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermission, serverPermission, channelPermission), [globalPermission, serverPermission, channelPermission]);
  const connectionStatus = useMemo(() => webRTC.remoteUserStatusList?.[memberUserId] || 'connecting', [memberUserId, webRTC.remoteUserStatusList]);
  const isUser = useMemo(() => memberUserId === userId, [memberUserId, userId]);
  const isSameChannel = useMemo(() => memberCurrentChannelId === channelId, [memberCurrentChannelId, channelId]);
  const isConnecting = useMemo(() => connectionStatus === 'connecting', [connectionStatus]);
  const isSpeaking = useMemo(() => !!webRTC.volumePercent?.[memberUserId], [memberUserId, webRTC.volumePercent]);
  const isVoiceMuted = useMemo(() => webRTC.volumePercent?.[memberUserId] === -1 || webRTC.mutedIds.includes(memberUserId), [memberUserId, webRTC.mutedIds, webRTC.volumePercent]);
  const isQueueControlled = useMemo(() => memberPosition === 0 && memberIsQueueControlled, [memberPosition, memberIsQueueControlled]);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = useMemo(() => permissionLevel > memberPermission, [permissionLevel, memberPermission]);
  const canUpdatePermission = useMemo(() => !isUser && isSuperior && isMember(memberPermission), [memberPermission, isUser, isSuperior]);
  const statusIcon = useMemo(() => {
    if (isVoiceMuted || memberIsVoiceMuted || isQueueControlled) return 'muted';
    if (isSpeaking) return 'play';
    if (memberIsTextMuted) return 'no-text';
    if (!isUser && isSameChannel && isConnecting) return 'loading';
    return '';
  }, [isUser, isSameChannel, isConnecting, isSpeaking, memberIsTextMuted, isVoiceMuted, memberIsVoiceMuted, isQueueControlled]);

  // Handlers
  const handleSetIsUserMuted = (userId: User['userId'], muted: boolean) => {
    webRTC.setIsUserMuted(userId, muted);
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Permission>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Permission>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleForbidUserTextInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleForbidUserVoiceInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
  };

  const handleIncreaseUserQueueTime = () => {
    ipc.socket.send('increaseUserQueueTime', { serverId, channelId, userId: memberUserId });
  };

  const handleMoveUserQueuePositionDown = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleMoveUserQueuePositionUp = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleRemoveUserFromQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberName }), () => ipc.socket.send('removeUserFromQueue', { serverId, channelId, userId }));
  };

  const handleClearQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-clear-queue'), () => ipc.socket.send('clearQueue', { serverId, channelId }));
  };

  const handleBlockUserFromServer = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromServer', { userId, serverId }));
  };

  const handleBlockUserFromChannel = (userId: User['userId'], channelId: Channel['channelId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId }));
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
  };

  const handleOpenInviteMember = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
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
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'increase-queue-time',
            label: t('increase-queue-time'),
            show: isChannelMod(permissionLevel),
            onClick: () => handleIncreaseUserQueueTime(),
          },
          {
            id: 'move-up-queue',
            label: t('move-up-queue'),
            show: memberPosition > 1 && isChannelMod(permissionLevel),
            onClick: () => handleMoveUserQueuePositionUp(memberUserId, serverId, channelId, memberPosition - 1),
          },
          {
            id: 'move-down-queue',
            label: t('move-down-queue'),
            show: memberPosition > 0 && isChannelMod(permissionLevel),
            onClick: () => handleMoveUserQueuePositionDown(memberUserId, serverId, channelId, memberPosition + 1),
          },
          {
            id: 'remove-from-queue',
            label: t('remove-from-queue'),
            show: isChannelMod(permissionLevel),
            onClick: () => handleRemoveUserFromQueue(memberUserId, serverId, channelId),
          },
          {
            id: 'clear-queue',
            label: t('clear-queue'),
            show: isChannelMod(permissionLevel),
            onClick: () => handleClearQueue(serverId, channelId),
          },
          {
            id: 'separator',
            label: '',
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
            label: isVoiceMuted ? t('unmute') : t('mute'),
            show: !isUser,
            onClick: () => handleSetIsUserMuted(memberUserId, !isVoiceMuted),
          },
          {
            id: 'edit-nickname',
            label: t('edit-nickname'),
            show: isMember(permissionLevel) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
            onClick: () => handleOpenEditNickname(memberUserId, serverId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'forbid-voice',
            label: memberIsVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior,
            onClick: () => handleForbidUserVoiceInChannel(memberUserId, serverId, channelId, !memberIsVoiceMuted),
          },
          {
            id: 'forbid-text',
            label: memberIsTextMuted ? t('unforbid-text') : t('forbid-text'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior,
            onClick: () => handleForbidUserTextInChannel(memberUserId, serverId, channelId, !memberIsTextMuted),
          },
          {
            id: 'kick-channel',
            label: t('kick-channel'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior && memberCurrentChannelId !== serverLobbyId,
            onClick: () => handleBlockUserFromChannel(memberUserId, channelId, serverId, memberNickname || memberName),
          },
          {
            id: 'kick-server',
            label: t('kick-server'),
            show: !isUser && isServerAdmin(permissionLevel) && isSuperior && memberCurrentServerId === serverId,
            onClick: () => handleBlockUserFromServer(memberUserId, serverId, memberNickname || memberName),
          },
          {
            id: 'block',
            label: t('block'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior,
            onClick: () => handleOpenBlockMember(memberUserId, serverId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'terminate-self-membership',
            label: t('terminate-self-membership'),
            show: isUser && isMember(permissionLevel) && !isServerOwner(permissionLevel),
            onClick: () => handleTerminateMember(userId, serverId, t('self')),
          },
          {
            id: 'invite-to-be-member',
            label: t('invite-to-be-member'),
            show: !isUser && !isMember(memberPermission) && isServerAdmin(permissionLevel),
            onClick: () => handleOpenInviteMember(memberUserId, serverId),
          },
          {
            id: 'member-management',
            label: t('member-management'),
            show: !isUser && isMember(memberPermission) && isSuperior,
            icon: 'submenu',
            hasSubmenu: true,
            submenuItems: [
              {
                id: 'terminate-member',
                label: t('terminate-member'),
                show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(memberPermission) && !isServerOwner(memberPermission),
                onClick: () => handleTerminateMember(memberUserId, serverId, memberName),
              },
              {
                id: 'set-channel-mod',
                label: isChannelMod(memberPermission) ? t('unset-channel-mod') : t('set-channel-mod'),
                show: canUpdatePermission && isChannelAdmin(permissionLevel) && !isChannelAdmin(memberPermission) && channelCategoryId !== null,
                onClick: () =>
                  isChannelMod(memberPermission)
                    ? handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 2 })
                    : handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 3 }),
              },
              {
                id: 'set-channel-admin',
                label: isChannelAdmin(memberPermission) ? t('unset-channel-admin') : t('set-channel-admin'),
                show: canUpdatePermission && isServerAdmin(permissionLevel) && !isServerAdmin(memberPermission),
                onClick: () =>
                  isChannelAdmin(memberPermission)
                    ? handleEditChannelPermission(memberUserId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
                    : handleEditChannelPermission(memberUserId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
              },
              {
                id: 'set-server-admin',
                label: isServerAdmin(memberPermission) ? t('unset-server-admin') : t('set-server-admin'),
                show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(memberPermission),
                onClick: () =>
                  isServerAdmin(memberPermission)
                    ? handleEditServerPermission(memberUserId, serverId, { permissionLevel: 2 })
                    : handleEditServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
              },
            ],
          },
        ]);
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[statusIcon]}`} title={memberUserId !== userId ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      <div className={`${styles['user-queue-position']}`}>{memberPosition + 1}.</div>
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
    </div>
  );
});

QueueMemberTab.displayName = 'QueueMemberTab';

export default QueueMemberTab;
