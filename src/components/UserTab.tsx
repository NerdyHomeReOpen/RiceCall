import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

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
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueUsers: Types.QueueUser[];
  channel: Types.Channel | Types.Category;
  member: Types.OnlineMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  canJoin: boolean;
  needsPassword: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ user, currentServer, currentChannel, friends, queueUsers, channel, member, selectedItemId, setSelectedItemId, canJoin, needsPassword }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();
  const findMe = useFindMeContext();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const isSpeaking = isSelf ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
  const isMuted = isSelf ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = permissionLevel > memberPermission;
  const isEqualOrSuperior = permissionLevel >= memberPermission;
  const isChannelQueueMode = channelVoiceMode === 'queue';

  // Handlers
  const getStatusIcon = () => {
    if (isMuted || isMemberVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
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

  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => Popup.connectChannel(currentServerId, channelId, canJoin, needsPassword))
      .addAddToQueueOption({ isSelf, isEqualOrSuperior, isQueueMode: isChannelQueueMode, isInQueue }, () => handleAddUserToQueue(memberUserId, currentServerId, channelId))
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, memberUserId))
      .addViewProfileOption(() => Popup.openUserInfo(userId, memberUserId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(userId, memberUserId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? handleUnmuteUser(memberUserId) : handleMuteUser(memberUserId)))
      .addEditNicknameOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openEditNickname(memberUserId, currentServerId))
      .addSeparator()
      .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrSuperior }, () => Popup.moveUserToChannel(memberUserId, currentServerId, currentChannelId))
      .addSeparator()
      .addForbidVoiceOption({ isSelf, isSuperior, isVoiceMuted: isMemberVoiceMuted }, () => handleForbidUserVoiceInChannel(memberUserId, currentServerId, channelId, !isMemberVoiceMuted))
      .addForbidTextOption({ isSelf, isSuperior, isTextMuted: isMemberTextMuted }, () => handleForbidUserTextInChannel(memberUserId, currentServerId, channelId, !isMemberTextMuted))
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isSuperior, isInLobby }, () => Popup.openKickMemberFromChannel(memberUserId, currentServerId, channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openKickMemberFromServer(memberUserId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(memberUserId, currentServerId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel }, () => Popup.terminateMember(userId, currentServerId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () => Popup.openInviteMember(memberUserId, currentServerId))
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId }, () => {}, getMemberManagementSubmenuItems())
      .build();

  const handleMuteUser = (userId: Types.User['userId']) => {
    webRTC.muteUser(userId);
  };

  const handleUnmuteUser = (userId: Types.User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  const handleAddUserToQueue = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
    ipc.socket.send('addUserToQueue', { userId, serverId, channelId });
  };

  const handleForbidUserTextInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleForbidUserVoiceInChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
  };

  const handleDragStart = (e: React.DragEvent, userId: Types.User['userId'], channelId: Types.Channel['channelId']) => {
    e.dataTransfer.setData('type', 'moveUser');
    e.dataTransfer.setData('userId', userId);
    e.dataTransfer.setData('currentChannelId', channelId);
  };

  // Effects
  useEffect(() => {
    if (!findMe || !isSelf) return;
    findMe.userTabRef.current = userTabRef.current;
  }, [findMe, isSelf]);

  return (
    <div
      ref={userTabRef}
      className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `user-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `user-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`user-${memberUserId}`);
      }}
      onDoubleClick={() => {
        if (isSelf) return;
        Popup.openDirectMessage(userId, memberUserId);
      }}
      onMouseEnter={(e) => {
        const { right: x, top: y } = e.currentTarget.getBoundingClientRect();
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          contextMenu.showUserInfoBlock(x, y, 'right-bottom', member);
        }, 200);
      }}
      onMouseLeave={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
      draggable={!isSelf && isSuperior && Permission.isChannelMod(permissionLevel)}
      onDragStart={(e) => handleDragStart(e, memberUserId, channelId)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const { clientX: x, clientY: y } = e;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={`${styles['user-text-state']} ${isMemberTextMuted ? styles['muted'] : ''}`} />
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <LevelIcon level={memberLevel} xp={memberXp} requiredXp={memberRequiredXp} showTooltip={false} />
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
