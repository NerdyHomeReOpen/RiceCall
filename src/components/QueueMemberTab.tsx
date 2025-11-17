import React, { useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { User, QueueUser, Channel, Server, Friend, OnlineMember } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeList from '@/components/BadgeList';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenDirectMessage, handleOpenUserInfo, handleOpenEditNickname, handleOpenApplyFriend, handleOpenBlockMember, handleOpenInviteMember } from '@/utils/popup';
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

const QueueMemberTabComponent: React.FC<QueueMemberTabProps> = ({ user, friends, server, channel, queueMember, selectedItemId, setSelectedItemId }) => {
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

  // Variables
  const permissionLevel = Math.max(globalPermission, serverPermission, channelPermission);
  const isUser = memberUserId === userId;
  const isSpeaking = isUser ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
  const isMuted = isUser ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
  const isControlled = memberPosition === 0 && memberIsQueueControlled && !isChannelMod(memberPermission);
  const isFriend = friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2);
  const isSuperior = permissionLevel > memberPermission;
  const canUpdatePermission = !isUser && isSuperior && isMember(memberPermission);

  const statusIcon = useMemo(() => {
    if (isMuted || memberIsVoiceMuted || isControlled) return 'muted';
    if (isSpeaking) return 'play';
    if (memberIsTextMuted) return 'no-text';
    return '';
  }, [isSpeaking, memberIsTextMuted, isMuted, memberIsVoiceMuted, isControlled]);
  const parsedBadges = useMemo(() => JSON.parse(memberBadges), [memberBadges]);
  const selectedKey = `queue-${memberUserId}`;
  const isSelected = selectedItemId === selectedKey;

  // Handlers
  const handleSetIsUserMuted = (userId: User['userId'], muted: boolean) => {
    webRTC.setUserMuted(userId, muted);
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
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

  return (
    <div
      className={`user-info-card-container ${styles['user-tab']} ${isSelected ? styles['selected'] : ''}`}
      onClick={() => {
        if (isSelected) setSelectedItemId(null);
        else setSelectedItemId(selectedKey);
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
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'increase-queue-time',
            label: t('increase-queue-time'),
            show: memberPosition === 0 && isChannelMod(permissionLevel),
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
            label: isMuted ? t('unmute') : t('mute'),
            show: !isUser,
            onClick: () => handleSetIsUserMuted(memberUserId, !isMuted),
          },
          {
            id: 'edit-nickname',
            label: t('edit-nickname'),
            show: isMember(memberPermission) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
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
            show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
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
      <div className={`${styles['user-audio-state']} ${styles[statusIcon]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      <div className={`${styles['user-queue-position']}`}>{memberPosition + 1}.</div>
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <BadgeList badges={parsedBadges} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
    </div>
  );
};

QueueMemberTabComponent.displayName = 'QueueMemberTab';

const hasFriendRelation = (friends: Friend[], memberId: User['userId']) =>
  friends.some((friend) => friend.targetId === memberId && friend.relationStatus === 2);

const areUsersBasicEqual = (prevUser: User, nextUser: User) =>
  prevUser.userId === nextUser.userId && prevUser.permissionLevel === nextUser.permissionLevel;

const areServersBasicEqual = (prevServer: Server, nextServer: Server) =>
  prevServer.serverId === nextServer.serverId &&
  prevServer.permissionLevel === nextServer.permissionLevel &&
  prevServer.lobbyId === nextServer.lobbyId;

const areChannelsBasicEqual = (prevChannel: Channel, nextChannel: Channel) =>
  prevChannel.channelId === nextChannel.channelId &&
  prevChannel.categoryId === nextChannel.categoryId &&
  prevChannel.permissionLevel === nextChannel.permissionLevel;

const areQueueMembersEqual = (prevMember: QueueUser & OnlineMember, nextMember: QueueUser & OnlineMember) =>
  prevMember.userId === nextMember.userId &&
  prevMember.name === nextMember.name &&
  prevMember.permissionLevel === nextMember.permissionLevel &&
  prevMember.nickname === nextMember.nickname &&
  prevMember.gender === nextMember.gender &&
  prevMember.badges === nextMember.badges &&
  prevMember.vip === nextMember.vip &&
  prevMember.isTextMuted === nextMember.isTextMuted &&
  prevMember.isVoiceMuted === nextMember.isVoiceMuted &&
  prevMember.currentServerId === nextMember.currentServerId &&
  prevMember.currentChannelId === nextMember.currentChannelId &&
  prevMember.position === nextMember.position &&
  prevMember.leftTime === nextMember.leftTime &&
  prevMember.isQueueControlled === nextMember.isQueueControlled;

const didQueueSelectionChange = (prevSelectedId: string | null, nextSelectedId: string | null, memberId: User['userId']) => {
  const prevSelected = prevSelectedId === `queue-${memberId}`;
  const nextSelected = nextSelectedId === `queue-${memberId}`;
  return prevSelected !== nextSelected;
};

const areQueueMemberTabPropsEqual = (prev: Readonly<QueueMemberTabProps>, next: Readonly<QueueMemberTabProps>) => {
  if (!areUsersBasicEqual(prev.user, next.user)) return false;
  if (!areServersBasicEqual(prev.server, next.server)) return false;
  if (!areChannelsBasicEqual(prev.channel, next.channel)) return false;
  if (!areQueueMembersEqual(prev.queueMember, next.queueMember)) return false;

  if (prev.friends !== next.friends) {
    const prevFriend = hasFriendRelation(prev.friends, prev.queueMember.userId);
    const nextFriend = hasFriendRelation(next.friends, next.queueMember.userId);
    if (prevFriend !== nextFriend) return false;
  }

  if (didQueueSelectionChange(prev.selectedItemId, next.selectedItemId, prev.queueMember.userId)) return false;

  return true;
};

export default React.memo(QueueMemberTabComponent, areQueueMemberTabPropsEqual);
