import React, { useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppDispatch, useAppSelector } from '@/store/hook';

import BadgeList from '@/components/BadgeList';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import * as Action from '@/action';

import * as Default from '@/utils/default';
import * as Permission from '@/utils/permission';

import { useQueueUserContextMenu } from '@/hooks/ctxMenus/queueUserCtxMenu';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface QueueUserTabProps {
  queueUserId: string;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUserId }) => {
  // Hooks
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { unmuteUser, muteUser } = useWebRTC();
  const dispatch = useAppDispatch();

  // Refs
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
      lobbyId: state.currentServer.data.lobbyId,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      categoryId: state.currentChannel.data.categoryId,
    }),
    shallowEqual,
  );

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const queueUser = useAppSelector((state) => state.queueUsers.data.find((qu) => qu.userId === queueUserId), shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `queue-${queueUserId}`, shallowEqual);
  const isSpeaking = useAppSelector((state) => (queueUserId === user.userId ? !!state.webrtc.speakingById['user'] : !!state.webrtc.speakingById[queueUserId]), shallowEqual);
  const isMuted = useAppSelector((state) => !!state.webrtc.mutedById[queueUserId], shallowEqual);

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const queueMember = useMemo(() => {
    const onlineMember = onlineMembers.find((om) => om.userId === queueUserId);
    if (!onlineMember || !queueUser) return Default.queueMember();
    return { ...queueUser, ...onlineMember };
  }, [onlineMembers, queueUser, queueUserId]);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === queueMember.userId && f.relationStatus === 2), [friends, queueMember.userId]);
  const isSelf = queueMember.userId === user.userId;
  const hasVip = queueMember.vip > 0;
  const isOnMic = queueMember.position === 0;
  const isControlled = isOnMic && queueMember.isQueueControlled && !Permission.isChannelMod(permissionLevel);

  // Functions
  const getStatusIcon = () => {
    if (isMuted || queueMember.isVoiceMuted || (!Permission.isChannelMod(permissionLevel) && isControlled)) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const { buildContextMenu: buildTabContextMenu } = useQueueUserContextMenu({
    user,
    currentServer,
    currentChannel,
    queueMember,
    isMuted,
    isFriend,
    onMuteUser: muteUser,
    onUnmuteUser: unmuteUser,
  });

  // Handlers
  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`queue-${queueMember.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    Action.openDirectMessage(user.userId, queueMember.userId);
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
      className={`user-info-card-container ${styles['user-tab']} ${isSelected ? styles['selected'] : ''}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onMouseEnter={handleTabMouseEnter}
      onMouseLeave={handleTabMouseLeave}
      onContextMenu={handleTabContextMenu}
    >
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[queueMember.gender]} ${permission[`lv-${queueMember.permissionLevel}`]}`} />
      <div className={`${styles['user-queue-position']}`}>{queueMember.position + 1}.</div>
      {hasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${queueMember.vip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${queueMember.nickname ? styles['member'] : ''} ${hasVip ? vip['vip-name-color'] : ''}`}>{queueMember.nickname || queueMember.name}</div>
      <BadgeList badges={JSON.parse(queueMember.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isOnMic && <div className={styles['queue-seconds-remaining-box']}>{queueMember.leftTime}s</div>}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;
