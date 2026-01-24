import React, { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC, useWebRTCIsMuted, useWebRTCIsSpeaking } from '@/providers/WebRTC';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface UserTabProps {
  member: Types.OnlineMember;
  channel: Types.Channel | Types.Category;
  isPasswordNeeded: boolean;
  canJoin: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, isPasswordNeeded, canJoin }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { unmuteUser, muteUser } = useWebRTC();
  const isSpeaking = useWebRTCIsSpeaking(member.userId);
  const isMuted = useWebRTCIsMuted(member.userId);
  const { setCurrentUserRef } = useFindMeContext();
  const dispatch = useAppDispatch();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
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
    }),
    shallowEqual,
  );

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const isInQueue = useAppSelector((state) => state.queueUsers.data.some((qu) => qu.userId === member.userId), shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `user-${member.userId}`, shallowEqual);

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isInSameChannel = member.currentChannelId === currentChannel.channelId;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;
  const isFriend = useMemo(() => friends.some((f) => f.targetId === member.userId && f.relationStatus === 2), [friends, member.userId]);
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isEqualOrLowerLevel = member.permissionLevel <= permissionLevel;
  const isChannelQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !isSelf && isLowerLevel && Permission.isChannelMod(permissionLevel);
  const hasVip = member.vip > 0;

  // Functions
  const getStatusIcon = () => {
    if (isMuted || member.isVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
        Popup.terminateMember(member.userId, currentServer.serverId, member.name),
      )
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
        Permission.isChannelMod(member.permissionLevel)
          ? Popup.editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
        Permission.isChannelAdmin(member.permissionLevel)
          ? Popup.editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
        Permission.isServerAdmin(member.permissionLevel)
          ? Popup.editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 2 })
          : Popup.editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 5 }),
      )
      .build();

  const getTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => Popup.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded))
      .addAddToQueueOption({ isSelf, isEqualOrLowerLevel, isQueueMode: isChannelQueueMode, isInQueue }, () => Popup.addUserToQueue(member.userId, currentServer.serverId, channel.channelId))
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, member.userId))
      .addViewProfileOption(() => Popup.openUserInfo(user.userId, member.userId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(user.userId, member.userId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? unmuteUser(member.userId) : muteUser(member.userId)))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openEditNickname(member.userId, currentServer.serverId))
      .addSeparator()
      .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrLowerLevel }, () =>
        Popup.moveUserToChannel(member.userId, currentServer.serverId, currentChannel.channelId),
      )
      .addSeparator()
      .addForbidVoiceOption({ isSelf, isLowerLevel, isVoiceMuted: member.isVoiceMuted }, () =>
        Popup.forbidUserVoiceInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isVoiceMuted),
      )
      .addForbidTextOption({ isSelf, isLowerLevel, isTextMuted: member.isTextMuted }, () =>
        Popup.forbidUserTextInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isTextMuted),
      )
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Popup.openKickMemberFromChannel(member.userId, currentServer.serverId, channel.channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openKickMemberFromServer(member.userId, currentServer.serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openBlockMember(member.userId, currentServer.serverId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel }, () => Popup.terminateMember(user.userId, currentServer.serverId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => Popup.openInviteMember(member.userId, currentServer.serverId))
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId },
        () => {},
        getMemberManagementSubmenuItems(),
      )
      .build();

  // Handlers
  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`user-${member.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    Popup.openDirectMessage(user.userId, member.userId);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify([member.userId]));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', currentChannel.channelId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getTabContextMenuItems());
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

  // Effects
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
      <div className={`${permission[member.gender]} ${permission[`lv-${member.permissionLevel}`]}`} />
      {hasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${member.vip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${member.nickname ? styles['member'] : ''} ${hasVip ? vip['vip-name-color'] : ''}`}>{member.nickname || member.name}</div>
      <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(member.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
