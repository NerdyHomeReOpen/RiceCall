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

const UserTab: React.FC<UserTabProps> = React.memo(
  ({
    member,
    friends,
    currentChannel,
    currentServer,
    selectedItemId,
    selectedItemType,
    setSelectedItemId,
    setSelectedItemType,
  }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();
    const socket = useSocket();
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
    const speakingStatus = webRTC.speakStatus?.[memberUserId] || (isCurrentUser && webRTC.volumePercent) || 0;
    const isSpeaking = speakingStatus !== 0;
    const isMuted = speakingStatus === -1;
    const isMutedByUser = webRTC.muteList.includes(memberUserId);
    const isFriend = friends.some((fd) => fd.targetId === memberUserId);
    const canApplyFriend = !isFriend && !isCurrentUser;
    const canManageMember =
      !isCurrentUser && userPermission > 4 && memberPermission < 6 && userPermission > memberPermission;
    const isServerAdmin = userPermission >= 5;
    const canEditNickname = (canManageMember && memberPermission != 1) || (isCurrentUser && userPermission > 1);
    const canChangeToGuest = canManageMember && memberPermission !== 1 && userPermission > 4;
    const canChangeToMember = canManageMember && memberPermission !== 2 && (memberPermission > 1 || userPermission > 5);
    const canChangeToChannelAdmin =
      canManageMember && memberPermission !== 3 && memberPermission > 1 && userPermission > 3;
    const canChangeToCategoryAdmin =
      canManageMember && memberPermission !== 4 && memberPermission > 1 && userPermission > 4;
    const canChangeToAdmin = canManageMember && memberPermission !== 5 && memberPermission > 1 && userPermission > 5;
    const canKickServer = canManageMember && memberCurrentServerId === serverId;
    const canKickChannel = canManageMember && memberCurrentChannelId !== serverLobbyId;
    const canBan = canManageMember;
    const canMoveToChannel =
      isServerAdmin && userPermission >= memberPermission && memberCurrentChannelId !== currentChannelId;
    const canRemoveMembership = isCurrentUser && userPermission > 1 && userPermission < 6;

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
        socket.send.disconnectServer({ userId, serverId });
      });
    };

    const handleKickChannel = (
      userId: User['userId'],
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
      userName: User['name'],
    ) => {
      if (!socket) return;
      handleOpenAlertDialog(t('confirm-kick-user').replace('{0}', userName), () => {
        socket.send.disconnectChannel({ userId, channelId, serverId });
      });
    };

    const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId']) => {
      if (!socket) return;
      socket.send.editMember({
        member,
        userId,
        serverId,
      });
    };

    const handleMoveToChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, serverId, channelId });
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
        title: message,
        submitTo: 'alertDialog',
      });
      ipcService.popup.onSubmit('alertDialog', callback);
    };

    const handleRemoveMembership = (
      memberId: User['userId'],
      serverId: Server['serverId'],
      memberName: User['name'],
    ) => {
      if (!socket) return;
      handleOpenAlertDialog(
        t('confirm-remove-membership').replace('{0}', memberId === userId ? t('self') : memberName),
        () => {
          handleEditMember({ permissionLevel: 1, nickname: null }, memberId, serverId);
        },
      );
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
        className={`context-menu-container ${styles['userTab']} ${
          selectedItemId === memberUserId && selectedItemType === 'user' ? styles['selected'] : ''
        }`}
        onMouseEnter={() => {
          if (!userTabRef.current) return;
          const x = userTabRef.current.getBoundingClientRect().left + userTabRef.current.getBoundingClientRect().width;
          const y = userTabRef.current.getBoundingClientRect().top;
          contextMenu.showUserInfoBlock(x, y, false, member);
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
              label: isMutedByUser ? t('unmute') : t('mute'),
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
              show: canManageMember || canRemoveMembership,
            },
            {
              id: 'remove-self-membership',
              label: t('remove-self-membership'),
              show: canRemoveMembership,
              onClick: () => {
                handleRemoveMembership(userId, serverId, memberName);
              },
            },
            {
              id: 'send-member-application',
              label: t('send-member-application'),
              show: canManageMember && memberPermission === 1,
              disabled: true,
              onClick: () => {
                /* sendMemberApplication() */
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
                  onClick: () => handleEditMember({ permissionLevel: 2 }, memberUserId, serverId),
                },
                {
                  id: 'set-channel-mod',
                  label: t('set-channel-mod'),
                  show: canChangeToChannelAdmin,
                  onClick: () => handleEditMember({ permissionLevel: 3 }, memberUserId, serverId),
                },
                {
                  id: 'set-channel-admin',
                  label: t('set-channel-admin'),
                  show: canChangeToCategoryAdmin,
                  onClick: () => handleEditMember({ permissionLevel: 4 }, memberUserId, serverId),
                },
                {
                  id: 'set-admin',
                  label: t('set-admin'),
                  show: canChangeToAdmin,
                  onClick: () => handleEditMember({ permissionLevel: 5 }, memberUserId, serverId),
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
          className={`${styles['gradeIcon']} 
            ${permission[memberGender]} 
            ${permission[`lv-${memberPermission}`]}
          `}
        />
        {memberVip > 0 && (
          <div
            className={`
              ${vip['vipIcon']} 
              ${vip[`vip-small-${memberVip}`]}
            `}
          />
        )}
        <div
          className={`
            ${styles['userTabName']} 
            ${memberNickname ? styles['member'] : ''}
            ${memberVip > 0 ? vip['isVIP'] : ''}
          `}
        >
          {memberNickname || memberName}
        </div>
        <div
          className={`
            ${grade['grade']} 
            ${grade[`lv-${Math.min(56, memberLevel)}`]}
          `}
          style={{ cursor: 'default' }}
        />
        <BadgeListViewer badges={memberBadges} maxDisplay={5} />
        {isCurrentUser && <div className={styles['myLocationIcon']} />}
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

export default UserTab;
