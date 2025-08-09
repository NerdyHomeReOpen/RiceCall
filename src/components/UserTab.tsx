import React, { useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { PopupType, ServerMember, Channel, Server, User, Member, UserFriend, UserServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

interface UserTabProps {
  member: ServerMember;
  currentChannel: Channel;
  currentServer: UserServer;
  friends: UserFriend[];
  selectedItemId: string | null;
  selectedItemType: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedItemType: React.Dispatch<React.SetStateAction<string | null>>;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, friends, currentChannel, currentServer, selectedItemId, selectedItemType, setSelectedItemId, setSelectedItemType }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const socket = useSocket();
  const webRTC = useWebRTC();
  const findMe = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<NodeJS.Timeout | null>(null);

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
    currentCategoryId: memberCurrentCategoryId,
    adminChannelPermission: userPermission,
    blockText,
    blockVoice   
  } = member;
  const { userId, serverId, lobbyId: serverLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const isCurrentUser = memberUserId === userId;
  const speakingStatus = webRTC.speakStatus?.[memberUserId] || (isCurrentUser && webRTC.volumePercent) || 0;
  const isConnected = isCurrentUser || webRTC.connectionStatus?.[memberUserId] === 'connected';
  const isSpeaking = speakingStatus !== 0;
  const isMuted = speakingStatus === -1;
  const isMutedByUser = webRTC.muteList.includes(memberUserId);
  const isFriend = friends.some((fd) => fd.targetId === memberUserId);
  const canApplyFriend = !isFriend && !isCurrentUser;  
  const canManageMember =
      !isCurrentUser &&     
      userPermission > memberPermission;
    const canEditNickname =
      (canManageMember && userPermission > 4) ||
      (isCurrentUser && memberPermission > 1);
    const canChangeToGuest =
      canManageMember && memberPermission !== 1 && userPermission > 4;
    const canChangeToMember =
      canManageMember &&
      memberPermission !== 2 &&
      (memberPermission > 1 || userPermission > 5);
    const canRemoveChannelAdmin =
      canManageMember &&
      memberPermission === 3 &&
      ((userPermission === 4 && memberCurrentCategoryId !== null)
      || (userPermission > 4));
    const canChangeToChannelAdmin =
      canManageMember &&
      memberPermission == 2 &&      
      ((userPermission == 4 && memberCurrentCategoryId !== null) 
      || (userPermission > 4)) &&
      memberCurrentChannelId !== memberCurrentCategoryId &&
      memberCurrentChannelId !== serverLobbyId &&
      memberCurrentCategoryId !== null;
    const canChangeToCategoryAdmin =
      canManageMember &&
      memberPermission < 4 &&
      memberPermission > 1 &&
      userPermission > 4;
    const canRemoveCategoryAdmin =
      canManageMember &&
      memberPermission === 4 &&
      userPermission > 4;
    const canChangeToAdmin =
      canManageMember &&
      memberPermission < 5 &&
      memberPermission > 1 &&
      userPermission > 5;
    const canRemoveServerAdmin =
      canManageMember &&
      memberPermission === 5 &&
      userPermission > 5;
    const canKickServer = canManageMember && memberCurrentServerId === serverId && userPermission > 4;
    const canKickChannel =
      canManageMember && memberCurrentChannelId !== serverLobbyId
      && userPermission > 2;
    const canBan = canManageMember && userPermission > 4;
    const canMoveToChannel =
      canManageMember && memberCurrentChannelId !== currentChannelId && userPermission > 4;
    const canMute = !isCurrentUser && !isMutedByUser;
    const canUnmute = !isCurrentUser && isMutedByUser;
    const canRemoveMyMembership =
      isCurrentUser && userPermission > 1 && userPermission < 6;
    const canRemoveMembership =
      !isCurrentUser && userPermission > 4 && memberPermission > 1;
    const canSendMemberInvitation = canManageMember && userPermission > 4 && memberPermission === 1;
    const canForbidVoice = canManageMember && !isCurrentUser && (!blockVoice || blockVoice === 0) && userPermission > 2;
    const canForbidText = canManageMember && !isCurrentUser && (!blockText || blockText === 0) && userPermission > 2;
    const canUnforbidVoice = canManageMember &&  !isCurrentUser && blockVoice === 1 && userPermission > 2;
    const canUnforbidText = canManageMember &&  !isCurrentUser && blockText === 1 && userPermission > 2;
    const isServerAdmin = userPermission > 4;

  // Handlers
  const handleMuteUser = (userId: User['userId']) => {
    if (!webRTC) return;
    webRTC.handleMute(userId);
  };

  const handleUnmuteUser = (userId: User['userId']) => {
    if (!webRTC) return;
    webRTC.handleUnmute(userId);
  };

  const handleKickServer = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-kick-user').replace('{0}', userName), () => {
      socket.send.disconnectServer({ userId, serverId, blockTime: 1000 * 60 * 60 * 1 });
    });
  };

  const handleKickChannel = (userId: User['userId'], channelId: Channel['channelId'], serverId: Server['serverId'], userName: User['name']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-kick-user').replace('{0}', userName), () => {
      socket.send.disconnectChannel({ userId, channelId, serverId, kickChannel: true });
    });
  };

  const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId'], channelId?: Channel['channelId'], categoryId?: Channel['categoryId'],  skipPermissionLevel?: boolean) => {   
    if (!socket) return;
    socket.send.editMember({
      member,
      userId,
      serverId,
      channelId,
      categoryId,
      skipPermissionLevel
    });
  };

   const handleCreateMemberInvitation = ({
      receiverId,
      serverId,
    }: {
      receiverId: User['userId'],
      serverId: Server['serverId']
    }) => {
      if (!socket) return;
      socket.send.createMemberInvitationApplication({
        receiverId,
        serverId,
      });
    };

  const handleMoveToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    if (!socket) return;
    socket.send.connectChannel({ userId, serverId, channelId });
  };

   const handleForbidMemberVoice = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.forbidMemberVoice({ userId, serverId, channelId });
    };

    const handleUnforbidMemberVoice = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.unforbidMemberVoice({ userId, serverId, channelId });
    };

    const handleForbidMemberText = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.forbidMemberText({ userId, serverId, channelId });
    };

    const handleUnforbidMemberText = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.unforbidMemberText({ userId, serverId, channelId });
    };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open(PopupType.EDIT_NICKNAME, 'editNickname');
    ipcService.initialData.onRequest('editNickname', {
      serverId,
      userId,
    });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
    ipcService.initialData.onRequest('applyFriend', {
      userId,
      targetId,
    });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {  
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, {
      userId,
      targetId,
      targetName,
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, {
      userId,
      targetId,
    });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', {
      message: message,
      submitTo: 'alertDialog',
    });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleRemoveMembership = (userId: User['userId'], serverId: Server['serverId'], memberName: User['name']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-remove-membership').replace('{0}', memberName), () => {
      handleEditMember({ permissionLevel: 1, nickname: null }, userId, serverId);
    });
  };

   const handleCreateMemberApplication = (
      receiverId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;  
      handleOpenAlertDialog(t('confirm-send-membership').replace('{0}', memberName), () => {
         handleCreateMemberInvitation(
            {
              receiverId: receiverId,
              serverId: serverId,
            }        
          );
      });     
    };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    ipcService.popup.open(PopupType.BLOCK_MEMBER, `blockMember-${userId}`);
    ipcService.initialData.onRequest(`blockMember-${userId}`, {
      userId,
      serverId,
      userName,
    });
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
      className={`context-menu-container ${styles['user-tab']} ${selectedItemId === memberUserId && selectedItemType === 'user' ? styles['selected'] : ''}`}
      onMouseEnter={() => {
        if (counterRef.current) {
          clearTimeout(counterRef.current);
        }

        counterRef.current = setTimeout(() => {
          if (!userTabRef.current) return;
          const x = userTabRef.current.getBoundingClientRect().left + userTabRef.current.getBoundingClientRect().width;
          const y = userTabRef.current.getBoundingClientRect().top;
          contextMenu.showUserInfoBlock(x, y, false, member);
        }, 1000);
      }}
      onMouseLeave={() => {
        if (counterRef.current) {
          clearTimeout(counterRef.current);
        }
      }}
      onClick={() => {
        if (selectedItemId === memberUserId && selectedItemType === 'user') {
          setSelectedItemId(null);
          setSelectedItemType(null);
          return;
        }
        setSelectedItemId(memberUserId);
        setSelectedItemType('user');
      }}
      onDoubleClick={() => {
        if (isCurrentUser) return;
        handleOpenDirectMessage(userId, memberUserId, memberName);
      }}
      draggable={isServerAdmin && !isCurrentUser}
      onDragStart={(e) => handleDragStart(e, memberUserId, memberCurrentChannelId)}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
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
            label: t('mute'),
            show: canMute,
            onClick: () => handleMuteUser(memberUserId),
          },
          {
            id: 'set-unmute',
            label: t('unmute'),
            show: canUnmute,
            onClick: () => handleUnmuteUser(memberUserId),
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
            show: canManageMember && canForbidVoice,
            onClick: () => 
              handleForbidMemberVoice(memberUserId, serverId, member.currentChannelId),
          },
          {
            id: 'unforbid-voice',
            label: t('unforbid-voice'),
            show: canManageMember && canUnforbidVoice,
            onClick: () => 
              handleUnforbidMemberVoice(memberUserId, serverId, member.currentChannelId),
          },          
          {
            id: 'forbid-text',
            label: t('forbid-text'),
            show: canManageMember && canForbidText,
            onClick: () => 
              handleForbidMemberText(memberUserId, serverId, member.currentChannelId),
          },
          {
            id: 'unforbid-text',
            label: t('unforbid-text'),
            show: canManageMember && canUnforbidText,
            onClick: () => 
              handleUnforbidMemberText(memberUserId, serverId, member.currentChannelId),
          },
          {
            id: 'kick-channel',
            label: t('kick-channel'),
            show: canKickChannel,
            onClick: () => {
              handleKickChannel(memberUserId, memberCurrentChannelId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'kick-server',
            label: t('kick-server'),
            show: canKickServer,
            onClick: () => {
              handleKickServer(memberUserId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'block',
            label: t('block'),
            show: canBan,
            onClick: () => {
              handleOpenBlockMember(memberUserId, serverId, memberNickname || memberName);
            },
          },
          {
            id: 'separator',
            label: '',
            show: canRemoveMyMembership 
              || canRemoveMembership 
              || canRemoveChannelAdmin 
              || canRemoveCategoryAdmin
              || canRemoveServerAdmin
              || canChangeToAdmin
              || canChangeToCategoryAdmin
              || canChangeToChannelAdmin
              || canChangeToMember
              || canChangeToGuest,
          },
          {
            id: 'remove-self-membership',
            label: t('remove-self-membership'),
            show: canRemoveMyMembership,
            onClick: () => {
              handleRemoveMembership(userId, serverId, t('self'));
            },
          },
          {
            id: 'send-member-application',
            label: t('send-member-application'),
            show: canManageMember && canSendMemberInvitation,
            disabled: true,
            onClick: () => {
              handleCreateMemberApplication(memberUserId, serverId)
            },
          },
          {
            id: 'member-management',
            label: t('member-management'),
            show: canManageMember && ((userPermission == 4 && memberCurrentCategoryId !== null) || userPermission > 4) && memberPermission > 1,
            icon: 'submenu',
            hasSubmenu: true,
              submenuItems: [                
                {
                  id: 'remove-membership',
                  label: t('remove-membership'),
                  show: canRemoveMembership,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 1 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'remove-channel-admin',
                  label: t('remove-channel-admin'),
                  show: canRemoveChannelAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 2 },
                      memberUserId,
                      serverId,
                      memberCurrentChannelId,
                      memberCurrentCategoryId,
                      true
                    ),
                },
                 {
                  id: 'remove-category-admin',
                  label: t('remove-category-admin'),
                  show: canRemoveCategoryAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 2 },
                      memberUserId,
                      serverId,
                      memberCurrentCategoryId ? memberCurrentCategoryId : memberCurrentChannelId,
                      memberCurrentCategoryId,
                      true
                    ),
                },
                {
                  id: 'remove-server-admin',
                  label: t('remove-server-admin'),
                  show: canRemoveServerAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 2 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'set-channel-admin',
                  label: t('set-channel-admin'),
                  show: canChangeToChannelAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 3 },
                      memberUserId,
                      serverId,
                      member.currentChannelId,
                      member.currentCategoryId
                    ),
                },
                {
                  id: 'set-category-admin',
                  label: t('set-category-admin'),
                  show: canChangeToCategoryAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 4 },
                      memberUserId,
                      serverId,
                      member.currentCategoryId ? member.currentCategoryId : member.currentChannelId
                    ),
                },
                {
                  id: 'set-admin',
                  label: t('set-admin'),
                  show: canChangeToAdmin,
                  onClick: () =>
                    handleEditMember(
                      { permissionLevel: 5 },
                      memberUserId,
                      serverId,
                    ),
                },
              ],
          },
        ]);
      }}
    >
      <div
        className={`${styles['user-audio-state']}
      ${!isConnected ? styles['loading'] : ''}
      ${isConnected && isSpeaking && !isMuted ? styles['play'] : ''}
      ${isConnected && !isSpeaking && isMuted ? styles['muted'] : ''}
      ${(isMutedByUser || blockVoice === 1) ? styles['muted'] : ''}   `}
      />
      {blockText === 1 && (
        <div
          className={`
            ${styles['user-audio-state']} 
            ${styles['notext']}
          `}
        />
      )}
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
