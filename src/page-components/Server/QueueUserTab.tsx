import React, { useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import {
  clearQueue,
  editChannelPermission,
  editServerPermission,
  forbidUserTextInChannel,
  forbidUserVoiceInChannel,
  increaseUserQueueTime,
  moveUserQueuePositionDown,
  moveUserQueuePositionUp,
  openApplyFriend,
  openBlockMember,
  openDirectMessage,
  openEditNickname,
  openInviteMember,
  openKickMemberFromChannel,
  openKickMemberFromServer,
  openUserInfo,
  removeUserFromQueue,
  terminateMember,
} from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/BadgeList';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import ContextMenu from '@/utils/contextMenu';
import { getDefaultQueueMember } from '@/utils';

import styles from './Server.module.css';

interface QueueUserTabProps {
  queueUserId: string;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUserId }) => {
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { unmuteUser, muteUser } = useWebRTC();
  const dispatch = useAppDispatch();

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const currentChannelCategoryId = useAppSelector((state) => state.currentChannel.data.categoryId);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const queueUser = useAppSelector((state) => state.queueUsers.data.find((qu) => qu.userId === queueUserId), shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `queue-${queueUserId}`);
  const isSpeaking = useAppSelector((state) => (queueUserId === userId ? !!state.webrtc.speakingById['user'] : !!state.webrtc.speakingById[queueUserId]));
  const isMuted = useAppSelector((state) => !!state.webrtc.mutedById[queueUserId]);

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const queueMember = useMemo(() => {
    const onlineMember = onlineMembers.find((om) => om.userId === queueUserId);
    if (!onlineMember || !queueUser) return getDefaultQueueMember();
    return { ...queueUser, ...onlineMember };
  }, [onlineMembers, queueUser, queueUserId]);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === queueMember.userId && f.relationStatus === 2), [friends, queueMember.userId]);
  const isSelf = queueMember.userId === userId;
  const hasVip = queueMember.vip > 0;
  const isOnMic = queueMember.position === 0;
  const isControlled = isOnMic && queueMember.isQueueControlled && permissionLevel < Types.Permission.ChannelMod;
  const isLowerLevel = queueMember.permissionLevel < permissionLevel;
  const isInLobby = queueMember.currentChannelId === currentServerLobbyId;

  const getStatusIcon = () => {
    if (isMuted || queueMember.isVoiceMuted || (permissionLevel < Types.Permission.ChannelMod && isControlled)) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`queue-${queueMember.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    openDirectMessage(userId, queueMember.userId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => increaseUserQueueTime(queueMember.userId, currentServerId, currentChannelId))
      .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () => moveUserQueuePositionUp(queueMember.userId, currentServerId, currentChannelId, queueMember.position - 1))
      .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
        moveUserQueuePositionDown(queueMember.userId, currentServerId, currentChannelId, queueMember.position + 1),
      )
      .addRemoveFromQueueOption({ permissionLevel }, () => removeUserFromQueue(queueMember.userId, currentServerId, currentChannelId, queueMember.name))
      .addClearQueueOption({ permissionLevel }, () => clearQueue(currentServerId, currentChannelId))
      .addSeparator()
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, queueMember.userId))
      .addViewProfileOption(() => openUserInfo(userId, queueMember.userId))
      .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(userId, queueMember.userId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? unmuteUser(queueMember.userId) : muteUser(queueMember.userId)))
      .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(queueMember.userId, currentServerId))
      .addSeparator()
      .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
        forbidUserVoiceInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isVoiceMuted),
      )
      .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
        forbidUserTextInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isTextMuted),
      )
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(queueMember.userId, currentServerId, currentChannelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(queueMember.userId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(queueMember.userId, currentServerId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(userId, currentServerId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => openInviteMember(queueMember.userId, currentServerId))
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
            terminateMember(queueMember.userId, currentServerId, queueMember.name),
          )
          .addSetChannelModOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
            queueMember.permissionLevel >= Types.Permission.ChannelMod
              ? editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 3 }),
          )
          .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
            queueMember.permissionLevel >= Types.Permission.ChannelAdmin
              ? editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 4 }),
          )
          .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
            queueMember.permissionLevel >= Types.Permission.ServerAdmin
              ? editServerPermission(queueMember.userId, currentServerId, { permissionLevel: 2 })
              : editServerPermission(queueMember.userId, currentServerId, { permissionLevel: 5 }),
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleTabMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const { right: x, top: y } = e.currentTarget.getBoundingClientRect();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      showUserInfoBlock(x, y, 'right-bottom', queueMember);
    }, 200);
  };

  const handleTabMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  return (
    <div
      className={`user-info-card-container ${styles['queue-user-tab']} ${isSelected ? styles['selected'] : ''}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onMouseEnter={handleTabMouseEnter}
      onMouseLeave={handleTabMouseLeave}
      onContextMenu={handleTabContextMenu}
    >
      <div className={`${styles['audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`permission-${queueMember.gender} permission-lv-${queueMember.permissionLevel}`} />
      <div className={`${styles['position-text']}`}>{queueMember.position + 1}.</div>
      {hasVip && <div className={`vip-icon vip-${queueMember.vip}`} />}
      <div className={`${styles['name-text']} ${queueMember.nickname ? styles['member'] : ''} ${hasVip ? styles['vip'] : ''}`}>{queueMember.nickname || queueMember.name}</div>
      <BadgeList badges={JSON.parse(queueMember.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isOnMic && <div className={styles['time-remaining']}>{queueMember.leftTime}s</div>}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;
