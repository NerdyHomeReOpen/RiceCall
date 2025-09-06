import React, { useEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Server, User, OnlineMember, Friend, Permission, Category } from '@/types';

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
import { isMember, isServerAdmin, isServerOwner, isChannelMod, isChannelAdmin } from '@/utils/permission';

interface UserTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  channel: Channel | Category;
  member: OnlineMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ user, friends, channel, server, member, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();
  const findMe = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Destructuring
  const { userId, permissionLevel: globalPermission, currentChannelId: userCurrentChannelId } = user;
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
    isTextMuted: memberIsTextMuted,
    isVoiceMuted: memberIsVoiceMuted,
    currentChannelId: memberCurrentChannelId,
    currentServerId: memberCurrentServerId,
  } = member;
  const { channelId, categoryId: channelCategoryId, permissionLevel: channelPermission, voiceMode: channelVoiceMode } = channel;
  const { serverId, permissionLevel: serverPermission, lobbyId: serverLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermission, serverPermission, channelPermission), [globalPermission, serverPermission, channelPermission]);
  const connectionStatus = useMemo(() => webRTC.remoteUserStatusList?.[memberUserId] || 'connecting', [memberUserId, webRTC.remoteUserStatusList]);
  const isUser = useMemo(() => memberUserId === userId, [memberUserId, userId]);
  const isSameChannel = useMemo(() => memberCurrentChannelId === userCurrentChannelId, [memberCurrentChannelId, userCurrentChannelId]);
  const isConnecting = useMemo(() => connectionStatus === 'connecting', [connectionStatus]);
  const isSpeaking = useMemo(() => !!webRTC.volumePercent?.[memberUserId], [memberUserId, webRTC.volumePercent]);
  const isVoiceMuted = useMemo(() => webRTC.mutedIds.includes(memberUserId), [memberUserId, webRTC.mutedIds]);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = useMemo(() => permissionLevel > memberPermission, [permissionLevel, memberPermission]);
  const canUpdatePermission = useMemo(() => !isUser && isSuperior && isMember(memberPermission), [memberPermission, isUser, isSuperior]);
  const statusIcon = useMemo(() => {
    if (isVoiceMuted || memberIsVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    if (memberIsTextMuted) return 'no-text';
    if (!isUser && isSameChannel && isConnecting) return 'loading';
    return '';
  }, [isUser, isSameChannel, isConnecting, isSpeaking, memberIsTextMuted, isVoiceMuted, memberIsVoiceMuted]);

  // Handlers
  const handleMuteUser = (userId: User['userId']) => {
    webRTC.muteUser(userId);
  };

  const handleUnmuteUser = (userId: User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Permission>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Permission>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('connectChannel', { serverId, channelId });
  };

  const handleMoveUserToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('moveUserToChannel', { userId, serverId, channelId });
  };

  const handleAddUserToQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('addUserToQueue', { userId, serverId, channelId });
  };

  const handleMuteUserTextInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleMuteUserVoiceInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
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
      draggable={!isUser && isChannelMod(permissionLevel) && isSuperior}
      onDragStart={(e) => handleDragStart(e, memberUserId, channelId)}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'join-user-channel',
            label: t('join-user-channel'),
            show: !isUser && !isSameChannel,
            onClick: () => handleConnectChannel(serverId, channelId),
          },
          {
            id: 'add-to-queue',
            label: t('add-to-queue'),
            show: !isUser && isMember(permissionLevel) && isSuperior && isSameChannel && channelVoiceMode === 'queue',
            onClick: () => handleAddUserToQueue(memberUserId, serverId, channelId),
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
            onClick: () => (isVoiceMuted ? handleUnmuteUser(memberUserId) : handleMuteUser(memberUserId)),
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
            id: 'move-to-channel',
            label: t('move-to-channel'),
            show: !isUser && isChannelMod(permissionLevel) && !isSameChannel && isSuperior,
            onClick: () => handleMoveUserToChannel(memberUserId, serverId, userCurrentChannelId || ''),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'forbid-voice',
            label: memberIsVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior,
            onClick: () => handleMuteUserVoiceInChannel(memberUserId, serverId, channelId, !memberIsVoiceMuted),
          },
          {
            id: 'forbid-text',
            label: memberIsTextMuted ? t('unforbid-text') : t('forbid-text'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior,
            onClick: () => handleMuteUserTextInChannel(memberUserId, serverId, channelId, !memberIsTextMuted),
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
            show: !isUser && isMember(permissionLevel) && isSuperior,
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
                show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(memberPermission),
                onClick: () => handleTerminateMember(memberUserId, serverId, memberName),
              },
              // {
              //   id: 'set-member',
              //   label: t('set-member'),
              //   show: !isUser && isMember(memberPermission) && isSuperior && !isMember(memberPermission, false),
              //   onClick: () => {
              //     if (isServerAdmin(memberPermission, false)) {
              //       handleEditServerPermission(memberUserId, serverId, { permissionLevel: 2 });
              //     }
              //     if (isChannelAdmin(memberPermission) && channelCategoryId) {
              //       handleEditChannelPermission(memberUserId, serverId, channelCategoryId, { permissionLevel: 2 });
              //     }
              //     handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 2 });
              //   },
              // },
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
      <div className={`${styles['user-audio-state']} ${styles[statusIcon]}`} title={!isUser ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
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
