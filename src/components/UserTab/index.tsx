import React, { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Actions from '@/action';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useMemberContextMenu } from '@/hooks/ContextMenus/Member';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { setSelectedItemId } from '@/store/slices/UI';

import { isChannelMod } from '@/utils/permission';

import styles from '@/styles/Server.module.css';
import vipStyles from '@/styles/Vip.module.css';
import permissionStyles from '@/styles/Permission.module.css';

interface UserTabProps {
  member: Types.OnlineMember;
  channel: Types.Channel | Types.Category;
  isPasswordNeeded: boolean;
  canJoin: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, isPasswordNeeded, canJoin }) => {
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { muteUser, unmuteUser } = useWebRTC();
  const { setCurrentUserRef } = useFindMeContext();
  const dispatch = useAppDispatch();

  const userTabRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    }),
    shallowEqual,
  );

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const isInQueue = useAppSelector((state) => state.queueUsers.data.some((qu) => qu.userId === member.userId), shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `user-${member.userId}`, shallowEqual);
  const isSpeaking = useAppSelector((state) => (member.userId === user.userId ? !!state.webrtc.speakingById['user'] : !!state.webrtc.speakingById[member.userId]), shallowEqual);
  const isMuted = useAppSelector((state) => !!state.webrtc.mutedById[member.userId], shallowEqual);

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isFriend = useMemo(() => friends.some((f) => f.targetId === member.userId && f.relationStatus === 2), [friends, member.userId]);
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isChannelQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !isSelf && isLowerLevel && isChannelMod(permissionLevel);
  const hasVip = member.vip > 0;

  const { buildContextMenu } = useMemberContextMenu({
    member,
    channel,
    user,
    currentServer,
    currentChannel,
    isMuted,
    isFriend,
    isInQueue,
    isChannelQueueMode,
    canJoin,
    isPasswordNeeded,
    onMuteUser: muteUser,
    onUnmuteUser: unmuteUser,
  });

  const getStatusIcon = () => {
    if (isMuted || member.isVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`user-${member.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    Actions.openDirectMessage(user.userId, member.userId);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify([member.userId]));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', member.currentChannelId || '');
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
  };

  const handleTabMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { right: x, top: y } = e.currentTarget.getBoundingClientRect();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      showUserInfoBlock(x, y, 'right-bottom', member);
    }, 200);
  };

  const handleTabMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  useEffect(() => {
    if (!isSelf) return;
    setCurrentUserRef(userTabRef.current);
  }, [isSelf, setCurrentUserRef]);

  return (
    <div
      ref={userTabRef}
      className={`user-info-card-container ${styles['user-tab']} ${isSelected ? styles['selected'] : ''}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onMouseEnter={handleTabMouseEnter}
      onMouseLeave={handleTabMouseLeave}
      draggable={isDraggable}
      onDragStart={handleTabDragStart}
      onContextMenu={handleTabContextMenu}
    >
      <div className={`${styles['user-text-state']} ${member.isTextMuted ? styles['muted'] : ''}`} />
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permissionStyles[member.gender]} ${permissionStyles[`lv-${member.permissionLevel}`]}`} />
      {hasVip && <div className={`${vipStyles['vip-icon']} ${vipStyles[`vip-${member.vip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${member.nickname ? styles['member'] : ''} ${hasVip ? vipStyles['vip-name-color'] : ''}`}>{member.nickname || member.name}</div>
      <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(member.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
