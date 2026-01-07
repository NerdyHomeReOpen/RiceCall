import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';
import { useWebRTC } from '@/providers/WebRTC';

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
  canJoin: boolean;
  needsPassword: boolean;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, canJoin, needsPassword, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { isMuted, isSpeaking, unmuteUser, muteUser } = useWebRTC();
  const { userTabRef: findMeUserTabRef } = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const friends = useAppSelector((state) => state.friends.data);
  const queueUsers = useAppSelector((state) => state.queueUsers.data);

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const { channelId, categoryId: channelCategoryId, voiceMode: channelVoiceMode } = channel;
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    xp: memberXp,
    requiredXp: memberRequiredXp,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: isMemberTextMuted,
    isVoiceMuted: isMemberVoiceMuted,
    currentChannelId: memberCurrentChannelId,
  } = member;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = memberUserId === userId;
  const isInSameChannel = memberCurrentChannelId === currentChannelId;
  const isInLobby = memberCurrentChannelId === currentServerLobbyId;
  const isInQueue = useMemo(() => queueUsers.some((qu) => qu.userId === memberUserId), [queueUsers, memberUserId]);
  const isUserSpeaking = isSelf ? isSpeaking('user') : isSpeaking(memberUserId);
  const isUserMuted = isSelf ? isMuted('user') : isMuted(memberUserId);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = permissionLevel > memberPermission;
  const isEqualOrSuperior = permissionLevel >= memberPermission;
  const isChannelQueueMode = channelVoiceMode === 'queue';
  const isSelected = selectedItemId === `user-${memberUserId}`;
  const isDraggable = !isSelf && isSuperior && Permission.isChannelMod(permissionLevel);
  const memberHasVip = memberVip > 0;

  // Functions
  const getStatusIcon = () => {
    if (isUserMuted || isMemberVoiceMuted) return 'muted';
    if (isUserSpeaking) return 'play';
    return '';
  };

  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () => Popup.terminateMember(memberUserId, currentServerId, memberName))
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId }, () =>
        Permission.isChannelMod(memberPermission)
          ? Popup.editChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(memberUserId, currentServerId, channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId }, () =>
        Permission.isChannelAdmin(memberPermission)
          ? Popup.editChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(memberUserId, currentServerId, channelCategoryId || channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () =>
        Permission.isServerAdmin(memberPermission)
          ? Popup.editServerPermission(memberUserId, currentServerId, { permissionLevel: 2 })
          : Popup.editServerPermission(memberUserId, currentServerId, { permissionLevel: 5 }),
      )
      .build();

  const getTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => Popup.connectChannel(currentServerId, channelId, canJoin, needsPassword))
      .addAddToQueueOption({ isSelf, isEqualOrSuperior, isQueueMode: isChannelQueueMode, isInQueue }, () => Popup.addUserToQueue(memberUserId, currentServerId, channelId))
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, memberUserId))
      .addViewProfileOption(() => Popup.openUserInfo(userId, memberUserId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(userId, memberUserId))
      .addSetMuteOption({ isSelf, isMuted: isUserMuted }, () => (isUserMuted ? unmuteUser(memberUserId) : muteUser(memberUserId)))
      .addEditNicknameOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openEditNickname(memberUserId, currentServerId))
      .addSeparator()
      .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrSuperior }, () => Popup.moveUserToChannel(memberUserId, currentServerId, currentChannelId))
      .addSeparator()
      .addForbidVoiceOption({ isSelf, isSuperior, isVoiceMuted: isMemberVoiceMuted }, () => Popup.forbidUserVoiceInChannel(memberUserId, currentServerId, channelId, !isMemberVoiceMuted))
      .addForbidTextOption({ isSelf, isSuperior, isTextMuted: isMemberTextMuted }, () => Popup.forbidUserTextInChannel(memberUserId, currentServerId, channelId, !isMemberTextMuted))
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isSuperior, isInLobby }, () => Popup.openKickMemberFromChannel(memberUserId, currentServerId, channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openKickMemberFromServer(memberUserId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(memberUserId, currentServerId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel }, () => Popup.terminateMember(userId, currentServerId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () => Popup.openInviteMember(memberUserId, currentServerId))
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId }, () => {}, getMemberManagementSubmenuItems())
      .build();

  // Handlers
  const handleTabClick = () => {
    if (isSelected) setSelectedItemId(null);
    else setSelectedItemId(`user-${memberUserId}`);
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    Popup.openDirectMessage(userId, memberUserId);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('type', 'moveUser');
    e.dataTransfer.setData('userId', memberUserId);
    e.dataTransfer.setData('currentChannelId', channelId);
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
    findMeUserTabRef.current = userTabRef.current;
  }, [findMeUserTabRef, isSelf]);

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
      <div className={`${styles['user-text-state']} ${isMemberTextMuted ? styles['muted'] : ''}`} />
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberHasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberHasVip ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <LevelIcon level={memberLevel} xp={memberXp} requiredXp={memberRequiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
