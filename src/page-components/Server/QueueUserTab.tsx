import React, { useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import * as Types from '@/types';

import * as Store from '@/store';

import { openDirectMessage } from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import { useQueueUserCtxMenu } from '@/hooks/ContextMenus/useQueueUserCtxMenu';

import BadgeList from '@/components/BadgeList';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import { getDefaultQueueMember } from '@/utils/default';

import styles from './Server.module.css';

interface QueueUserTabProps {
  queueUserId: string;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUserId }) => {
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

  const getStatusIcon = () => {
    if (isMuted || queueMember.isVoiceMuted || (permissionLevel < Types.Permission.ChannelMod && isControlled)) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const { buildContextMenu: buildTabContextMenu } = useQueueUserCtxMenu({
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    currentChannelCategoryId,
    queueMember,
    isMuted,
    isFriend,
    onMuteUser: muteUser,
    onUnmuteUser: unmuteUser,
  });

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
    showContextMenu(x, y, 'right-bottom', buildTabContextMenu());
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
