import React, { use, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Server, User, Member, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { isMember, isChannelAdmin, isCategoryAdmin, isServerAdmin, isServerOwner, isStaff } from '@/utils/permission';

interface UserTabProps {
  member: Member;
  currentChannel: Channel;
  currentServer: Server;
  friends: Friend[];
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, friends, currentChannel, currentServer, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();
  const findMe = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);

  // Variables
  const {
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    userId: memberUserId,
    currentChannelId: memberCurrentChannelId,
    currentServerId: memberCurrentServerId,
  } = member;
  const { userId, serverId, permissionLevel: userPermission, lobbyId: serverLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;

  const isCurrentUser = memberUserId === userId;
  const isSameChannel = memberCurrentChannelId === currentChannelId;
  const speakingStatus = webRTC.volumePercent?.[memberUserId];
  const connectionStatus = webRTC.remoteUserStatusList?.[memberUserId] || 'connecting';
  const isLoading = connectionStatus === 'connecting' || !connectionStatus;
  const isSpeaking = !!speakingStatus;
  const isMuted = speakingStatus === -1;
  const isMutedByUser = webRTC.mutedIds.includes(memberUserId);
  const isFriend = friends.some((fd) => fd.targetId === memberUserId);

  const canManageMember = !isCurrentUser && isServerAdmin(userPermission) && !isStaff(memberPermission) && userPermission > memberPermission;
  const canChangeToGuest = canManageMember && isMember(memberPermission);
  const canChangeToMember = canManageMember && isMember(memberPermission) && !isMember(memberPermission, false);
  const canChangeToChannelAdmin = canManageMember && isMember(memberPermission) && !isChannelAdmin(memberPermission) && isCategoryAdmin(userPermission);
  const canChangeToCategoryAdmin = canManageMember && isMember(memberPermission) && !isCategoryAdmin(memberPermission) && isServerAdmin(userPermission);
  const canChangeToAdmin = canManageMember && isMember(memberPermission) && !isServerAdmin(memberPermission) && isServerOwner(userPermission);

  const canKickServer = canManageMember && memberCurrentServerId === serverId;
  const canKickChannel = canManageMember && memberCurrentChannelId !== serverLobbyId;
  const canMoveToChannel = isServerAdmin(userPermission) && !isServerOwner(memberPermission) && memberCurrentChannelId !== currentChannelId;

  const canEditNickname = (canManageMember && isMember(memberPermission)) || (isCurrentUser && isMember(userPermission));
  const canRemoveMembership = isCurrentUser && isMember(userPermission) && !isServerOwner(userPermission);
  const canApplyFriend = !isFriend && !isCurrentUser;

  const statusIcon = () => {
    if (isMuted || isMutedByUser) return 'muted';
    if (!isCurrentUser && isSameChannel && isLoading) return 'loading';
    if (isSpeaking) return 'play';
    return '';
  };

  // Handlers
  const handleMuteUser = (userId: User['userId']) => {
    webRTC.muteUser(userId);
  };

  const handleUnmuteUser = (userId: User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  const handleEditMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipcService.socket.send('editMember', { userId, serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('connectChannel', { serverId, channelId });
  };

  const handleMoveToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveToChannel', { userId, serverId, channelId });
  };

  const handleAddToQueue = (userId: User['userId']) => {
    ipcService.socket.send('addToQueue', { userId, serverId, channelId: currentChannelId });
  };

  const handleKickFromServer = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipcService.socket.send('kickFromServer', { userId, serverId }));
  };

  const handleKickToLobbyChannel = (userId: User['userId'], channelId: Channel['channelId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipcService.socket.send('kickToLobbyChannel', { userId, serverId, channelId }));
  };

  const handleRemoveMembership = (userId: User['userId'], serverId: Server['serverId'], memberName: User['name']) => {
    handleOpenAlertDialog(t('confirm-remove-membership', { '0': memberName }), () => handleEditMember(userId, serverId, { permissionLevel: 1, nickname: null }));
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

  const handleSendMemberInvitation = (userId: User['userId'], serverId: Server['serverId']) => {
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
    if (!findMe || !isCurrentUser) return;
    findMe.userTabRef.current = userTabRef.current;
  }, [findMe, isCurrentUser]);

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
      draggable={userPermission >= memberPermission && !isCurrentUser}
      onDragStart={(e) => handleDragStart(e, memberUserId, memberCurrentChannelId)}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
          {
            id: 'join-user-channel',
            label: t('join-user-channel'),
            show: !isCurrentUser && !isSameChannel,
            onClick: () => handleConnectChannel(serverId, memberCurrentChannelId),
          },
          {
            id: 'add-to-queue',
            label: t('add-to-queue'),
            show: !isCurrentUser && canManageMember && isSameChannel,
            onClick: () => handleAddToQueue(memberUserId),
          },
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isCurrentUser,
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
            show: canApplyFriend,
            onClick: () => handleOpenApplyFriend(userId, memberUserId),
          },
          {
            id: 'set-mute',
            label: isMutedByUser ? t('unmute') : t('mute'),
            show: !isCurrentUser,
            onClick: () => (isMutedByUser ? handleUnmuteUser(memberUserId) : handleMuteUser(memberUserId)),
          },
          {
            id: 'edit-nickname',
            label: t('edit-nickname'),
            show: canEditNickname,
            onClick: () => handleOpenEditNickname(memberUserId, serverId),
          },
          {
            id: 'separator',
            label: '',
            show: canMoveToChannel,
          },
          {
            id: 'move-to-channel',
            label: t('move-to-channel'),
            show: canMoveToChannel,
            onClick: () => handleMoveToChannel(memberUserId, serverId, currentChannelId),
          },
          {
            id: 'separator',
            label: '',
            show: canManageMember,
          },
          {
            id: 'forbid-voice',
            label: t('forbid-voice'),
            show: canManageMember,
            disabled: true,
            onClick: () => {},
          },
          {
            id: 'forbid-text',
            label: t('forbid-text'),
            show: canManageMember,
            disabled: true,
            onClick: () => {},
          },
          {
            id: 'kick-channel',
            label: t('kick-channel'),
            show: canKickChannel,
            onClick: () => {
              handleKickToLobbyChannel(memberUserId, memberCurrentChannelId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'kick-server',
            label: t('kick-server'),
            show: canKickServer,
            onClick: () => {
              handleKickFromServer(memberUserId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'block',
            label: t('block'),
            show: canManageMember,
            onClick: () => {
              handleOpenBlockMember(memberUserId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'separator',
            label: '',
            show: canManageMember || canRemoveMembership,
          },
          {
            id: 'remove-self-membership',
            label: t('remove-self-membership'),
            show: canRemoveMembership,
            onClick: () => {
              handleRemoveMembership(userId, serverId, t('self'));
            },
          },
          {
            id: 'invite-to-be-member',
            label: t('invite-to-be-member'),
            show: canManageMember && memberPermission === 1,
            onClick: () => {
              handleSendMemberInvitation(memberUserId, serverId);
            },
          },
          {
            id: 'member-management',
            label: t('member-management'),
            show: canManageMember && memberPermission > 1,
            icon: 'submenu',
            hasSubmenu: true,
            submenuItems: [
              {
                id: 'set-guest',
                label: t('set-guest'),
                show: canChangeToGuest,
                onClick: () => handleRemoveMembership(memberUserId, serverId, memberNickname || memberName),
              },
              {
                id: 'set-member',
                label: t('set-member'),
                show: canChangeToMember,
                onClick: () => handleEditMember(memberUserId, serverId, { permissionLevel: 2 }),
              },
              {
                id: 'set-channel-mod',
                label: t('set-channel-mod'),
                show: canChangeToChannelAdmin,
                onClick: () => handleEditMember(memberUserId, serverId, { permissionLevel: 3 }),
              },
              {
                id: 'set-channel-admin',
                label: t('set-channel-admin'),
                show: canChangeToCategoryAdmin,
                onClick: () => handleEditMember(memberUserId, serverId, { permissionLevel: 4 }),
              },
              {
                id: 'set-server-admin',
                label: t('set-server-admin'),
                show: canChangeToAdmin,
                onClick: () => handleEditMember(memberUserId, serverId, { permissionLevel: 5 }),
              },
            ],
          },
        ]);
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[statusIcon()]}`} title={!isCurrentUser ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} style={{ cursor: 'default' }} />
      <BadgeListViewer badges={memberBadges} maxDisplay={5} />
      {isCurrentUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
