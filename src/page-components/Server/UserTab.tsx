import React, { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import {
  moveUserToChannel,
  openUserInfo,
  forbidUserVoiceInChannel,
  openDirectMessage,
  terminateMember,
  openInviteMember,
  openBlockMember,
  openKickMemberFromServer,
  openKickMemberFromChannel,
  forbidUserTextInChannel,
  openEditNickname,
  openApplyFriend,
  addUserToQueue,
  connectChannel,
  editServerPermission,
  editChannelPermission,
} from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';
import { useWebRTC } from '@/providers/WebRTC';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import ContextMenu from '@/utils/contextMenu';

import styles from './Server.module.css';

interface UserTabProps {
  member: Types.OnlineMember;
  channel: Types.Channel | Types.Category;
  isPasswordNeeded: boolean;
  canJoin: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, isPasswordNeeded, canJoin }) => {
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { muteUser, unmuteUser } = useWebRTC();
  const { setCurrentUserRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userTabRef = useRef<HTMLDivElement>(null);
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
  const isInQueue = useAppSelector((state) => state.queueUsers.data.some((qu) => qu.userId === member.userId));
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `user-${member.userId}`);
  const isSpeaking = useAppSelector((state) => (member.userId === userId ? !!state.webrtc.speakingById['user'] : !!state.webrtc.speakingById[member.userId]));
  const isMuted = useAppSelector((state) => !!state.webrtc.mutedById[member.userId]);

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = member.userId === userId;
  const isFriend = useMemo(() => friends.some((f) => f.targetId === member.userId && f.relationStatus === 2), [friends, member.userId]);
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isChannelQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !isSelf && isLowerLevel && permissionLevel >= Types.Permission.ChannelMod;
  const isInSameChannel = member.currentChannelId === currentChannelId;
  const isInLobby = member.currentChannelId === currentServerLobbyId;
  const isEqualOrLowerLevel = member.permissionLevel <= permissionLevel;
  const hasVip = member.vip > 0;

  const getStatusIcon = () => {
    if (isMuted || member.isVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`user-${member.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    openDirectMessage(userId, member.userId);
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

    const contextMenu = new ContextMenu()
      .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => connectChannel(currentServerId, channel.channelId, canJoin, isPasswordNeeded))
      .addAddToQueueOption({ permissionLevel, isSelf, isEqualOrLowerLevel, isChannelQueueMode, isInQueue }, () => addUserToQueue(member.userId, currentServerId, channel.channelId))
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, member.userId))
      .addViewProfileOption(() => openUserInfo(userId, member.userId))
      .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(userId, member.userId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? unmuteUser(member.userId) : muteUser(member.userId)))
      .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(member.userId, currentServerId))
      .addSeparator()
      .addMoveToChannelOption({ currentPermissionLevel: currentChannelPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrLowerLevel }, () =>
        moveUserToChannel(member.userId, currentServerId, currentChannelId),
      )
      .addSeparator()
      .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: member.isVoiceMuted }, () =>
        forbidUserVoiceInChannel(member.userId, currentServerId, channel.channelId, !member.isVoiceMuted),
      )
      .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: member.isTextMuted }, () =>
        forbidUserTextInChannel(member.userId, currentServerId, channel.channelId, !member.isTextMuted),
      )
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(member.userId, currentServerId, channel.channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(member.userId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(member.userId, currentServerId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(userId, currentServerId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => openInviteMember(member.userId, currentServerId))
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => terminateMember(member.userId, currentServerId, member.name))
          .addSetChannelModOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
            member.permissionLevel >= Types.Permission.ChannelMod
              ? editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 3 }),
          )
          .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
            member.permissionLevel >= Types.Permission.ChannelAdmin
              ? editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 4 }),
          )
          .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
            member.permissionLevel >= Types.Permission.ServerAdmin
              ? editServerPermission(member.userId, currentServerId, { permissionLevel: 2 })
              : editServerPermission(member.userId, currentServerId, { permissionLevel: 5 }),
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
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
      <div className={`${styles['text-state']} ${member.isTextMuted ? styles['muted'] : ''}`} />
      <div className={`${styles['audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`permission-${member.gender} permission-lv-${member.permissionLevel}`} />
      {hasVip && <div className={`vip-icon vip-${member.vip}`} />}
      <div className={`${styles['name-text']} ${member.nickname ? styles['member'] : ''} ${hasVip ? styles['vip'] : ''}`}>{member.nickname || member.name}</div>
      <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(member.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
