import React, { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';
import { Permission, RelationStatus } from '@/types';

import * as Store from '@/store';

import { openDirectMessage } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';
import { useWebRTC } from '@/providers/WebRTC';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useMemberCtxMenu } from '@/hooks/context-menus/useMemberCtxMenu';

import BadgeList from '@/components/badge-list';
import LevelIcon from '@/components/level-icon';

interface UserTabProps {
  member: Types.OnlineMember;
  channel: Types.Channel | Types.Category;
  isPasswordNeeded: boolean;
  canJoin: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, isPasswordNeeded, canJoin }) => {
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { muteUser, unmuteUser } = useWebRTC();
  const { setCurrentUserRef } = useLocateMeContext();
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
  const isFriend = useMemo(() => friends.some((f) => f.targetId === member.userId && f.relationStatus === RelationStatus.Friend), [friends, member.userId]);
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isChannelQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !isSelf && isLowerLevel && permissionLevel >= Permission.ChannelMod;
  const hasVip = member.vip > 0;

  const { buildContextMenu } = useMemberCtxMenu({
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

  const getStatusIconPosition = () => {
    if (isMuted || member.isVoiceMuted) return 'bg-[position:-12px_0]';
    if (isSpeaking) return 'bg-[position:-24px_0]';
    return 'bg-[position:-36px_0]';
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`user-${member.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    openDirectMessage(member.userId);
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
      className={`user-info-card-container relative flex gap-[2px] items-center h-[25px] py-[2px] pr-[20px] mr-[5px] text-shadow-[0_1px_#fff] pl-[25px] ${isSelected ? 'bg-selected' : 'hover:bg-hover'}`}
      onClick={handleTabClick}
      onDoubleClick={handleTabDoubleClick}
      onMouseEnter={handleTabMouseEnter}
      onMouseLeave={handleTabMouseLeave}
      draggable={isDraggable}
      onDragStart={handleTabDragStart}
      onContextMenu={handleTabContextMenu}
    >
      <div className={`min-w-[12px] min-h-[12px] bg-[url('/channel/audioState.svg')] bg-no-repeat bg-auto ${member.isTextMuted ? 'bg-[position:0_0]' : 'bg-[position:-36px_0]'}`} />
      <div className={`left-0 min-w-[12px] min-h-[12px] bg-[url('/channel/audioState.svg')] bg-no-repeat bg-auto ${getStatusIconPosition()}`} />
      <div className={`permission-${member.gender} permission-lv-${member.permissionLevel}`} />
      {hasVip && <div className={`vip-icon vip-${member.vip}`} />}
      <div className={`truncate ${hasVip ? 'text-text-vip-name' : member.nickname ? 'text-text-nickname' : 'text-text-color-quaternary'}`}>{member.nickname || member.name}</div>
      <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(member.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className="absolute right-[2px] min-w-[15px] min-h-[15px] cursor-pointer bg-[url('/mylocation.svg')] bg-no-repeat bg-cover" />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
