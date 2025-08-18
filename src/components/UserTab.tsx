import React, { useEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Server, User, OnlineMember, Friend, Permission } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeList from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { isMember, isServerAdmin, isServerOwner, isChannelMod, isChannelAdmin } from '@/utils/permission';

interface UserTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  channel: Channel;
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

  // Variables
  const { userId, permissionLevel: globalPermission, currentChannelId: userCurrentChannelId } = user;
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    currentChannelId: memberCurrentChannelId,
    currentServerId: memberCurrentServerId,
  } = member;
  const { channelId, categoryId: channelCategoryId, permissionLevel: channelPermission, voiceMode: channelVoiceMode } = channel;
  const { serverId, permissionLevel: serverPermission, lobbyId: serverLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => {
    return Math.max(globalPermission, serverPermission, channelPermission);
  }, [globalPermission, serverPermission, channelPermission]);

  const isUser = useMemo(() => {
    return memberUserId === userId;
  }, [memberUserId, userId]);

  const isSameChannel = useMemo(() => {
    return memberCurrentChannelId === userCurrentChannelId;
  }, [memberCurrentChannelId, userCurrentChannelId]);

  const connectionStatus = useMemo(() => {
    return webRTC.remoteUserStatusList?.[memberUserId] || 'connecting';
  }, [memberUserId, webRTC.remoteUserStatusList]);

  const isSpeaking = useMemo(() => {
    return !!webRTC.volumePercent?.[memberUserId];
  }, [memberUserId, webRTC.volumePercent]);

  const isMuted = useMemo(() => {
    return webRTC.volumePercent?.[memberUserId] === -1 || webRTC.mutedIds.includes(memberUserId);
  }, [memberUserId, webRTC.mutedIds, webRTC.volumePercent]);

  const isFriend = useMemo(() => {
    return friends.some((fd) => fd.targetId === memberUserId);
  }, [friends, memberUserId]);

  const isSuperior = useMemo(() => {
    return permissionLevel > memberPermission;
  }, [permissionLevel, memberPermission]);

  const statusIcon = useMemo(() => {
    if (isMuted) return 'muted';
    if (!isUser && isSameChannel && connectionStatus !== 'connected') return 'loading';
    if (isSpeaking) return 'play';
    return '';
  }, [isUser, isSameChannel, isMuted, isSpeaking, connectionStatus]);

  // Handlers
  const handleMuteUser = (userId: User['userId']) => {
    webRTC.muteUser(userId);
  };

  const handleUnmuteUser = (userId: User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Permission>) => {
    ipcService.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Permission>) => {
    ipcService.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('connectChannel', { serverId, channelId });
  };

  const handleMoveToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveToChannel', { userId, serverId, channelId });
  };

  const handleAddToQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('addToQueue', { userId, serverId, channelId });
  };

  const handleBlockFromServer = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipcService.socket.send('blockFromServer', { userId, serverId }));
  };

  const handleBlockFromChannel = (userId: User['userId'], channelId: Channel['channelId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipcService.socket.send('blockFromChannel', { userId, serverId, channelId }));
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipcService.socket.send('terminateMember', { userId, serverId }));
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    ipcService.popup.open('blockMember', `blockMember-${userId}`, { userId, serverId, userName });
  };

  const handleOpenInviteMember = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('inviteMember', `inviteMember-${userId}`, { userId, serverId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
  };

  const handleDragStart = (e: React.DragEvent, userId: User['userId'], channelId: Channel['channelId']) => {
    e.dataTransfer.setData('type', 'moveUser');
    e.dataTransfer.setData('userId', userId);
    e.dataTransfer.setData('currentChannelId', channelId);
  };

  // Effect
  useEffect(() => {
    if (!findMe || !isUser) return;
    findMe.userTabRef.current = userTabRef.current;
  }, [findMe, isUser]);

  return (
    <div
      ref={userTabRef}
      key={memberUserId}
      className={`context-menu-container ${styles['user-tab']} ${selectedItemId === `user-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `user-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`user-${memberUserId}`);
      }}
      onDoubleClick={() => {
        if (!userTabRef.current) return;
        const x = userTabRef.current.getBoundingClientRect().left + userTabRef.current.getBoundingClientRect().width;
        const y = userTabRef.current.getBoundingClientRect().top;
        contextMenu.showUserInfoBlock(x, y, false, member);
      }}
      draggable={!isUser && isChannelMod(permissionLevel) && isSuperior}
      onDragStart={(e) => handleDragStart(e, memberUserId, channelId)}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
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
            onClick: () => handleAddToQueue(memberUserId, serverId, channelId),
          },
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isUser,
            onClick: () => handleOpenDirectMessage(userId, memberUserId, memberName),
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
            onClick: () => handleMoveToChannel(memberUserId, serverId, userCurrentChannelId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'forbid-voice',
            label: t('forbid-voice'),
            show: !isUser && isMember(permissionLevel) && isSuperior,
            disabled: true,
            onClick: () => {},
          },
          {
            id: 'forbid-text',
            label: t('forbid-text'),
            show: !isUser && isMember(permissionLevel) && isSuperior,
            disabled: true,
            onClick: () => {},
          },
          {
            id: 'kick-channel',
            label: t('kick-channel'),
            show: !isUser && isChannelMod(permissionLevel) && isSuperior && memberCurrentChannelId !== serverLobbyId,
            onClick: () => handleBlockFromChannel(memberUserId, channelId, serverId, memberNickname || memberName),
          },
          {
            id: 'kick-server',
            label: t('kick-server'),
            show: !isUser && isServerAdmin(permissionLevel) && isSuperior && memberCurrentServerId === serverId,
            onClick: () => handleBlockFromServer(memberUserId, serverId, memberNickname || memberName),
          },
          {
            id: 'ban',
            label: t('ban'),
            show: !isUser && isMember(permissionLevel) && isSuperior,
            onClick: () => handleOpenBlockMember(memberUserId, serverId, memberNickname || memberName),
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
              {
                id: 'set-member',
                label: t('set-member'),
                show: !isUser && isMember(memberPermission) && isSuperior && !isMember(memberPermission, false),
                onClick: () => {
                  if (isServerAdmin(memberPermission, false)) {
                    handleEditServerPermission(memberUserId, serverId, { permissionLevel: 2 });
                  }
                  if (isChannelAdmin(memberPermission) && channelCategoryId) {
                    handleEditChannelPermission(memberUserId, serverId, channelCategoryId, { permissionLevel: 2 });
                  }
                  handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 2 });
                },
              },
              {
                id: 'set-channel-mod',
                label: t('set-channel-mod'),
                show: !isUser && channelCategoryId !== null && isMember(memberPermission) && isSuperior && !isChannelMod(memberPermission),
                onClick: () => handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 3 }),
              },
              {
                id: 'set-channel-admin',
                label: t('set-channel-admin'),
                show: !isUser && isMember(memberPermission) && isSuperior && !isChannelAdmin(memberPermission, false),
                onClick: () => handleEditChannelPermission(memberUserId, serverId, channelCategoryId ? channelCategoryId : channelId, { permissionLevel: 4 }),
              },
              {
                id: 'set-server-admin',
                label: t('set-server-admin'),
                show: !isUser && isMember(memberPermission) && isSuperior && !isServerAdmin(memberPermission, false),
                onClick: () => handleEditServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
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
      <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} style={{ cursor: 'default' }} />
      <BadgeList badges={JSON.parse(memberBadges)} maxDisplay={5} />
      {isUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
