import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface QueueUserTabProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueMember: Types.QueueMember;
  queueMembers: Types.QueueMember[];
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ user, currentServer, currentChannel, friends, queueMember, queueMembers, selectedItemId, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();

  // Refs
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId } = currentServer;
  const { channelId: currentChannelId, categoryId: currentChannelCategoryId } = currentChannel;
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: isMemberTextMuted,
    isVoiceMuted: isMemberVoiceMuted,
    currentChannelId: memberCurrentChannelId,
    position: memberPosition,
    leftTime: memberLeftTime,
    isQueueControlled,
  } = queueMember;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = memberUserId === userId;
  const isInLobby = memberCurrentChannelId === currentServerLobbyId;
  const isSpeaking = isSelf ? webRTC.isSpeaking('user') : webRTC.isSpeaking(memberUserId);
  const isMuted = isSelf ? webRTC.isMuted('user') : webRTC.isMuted(memberUserId);
  const isControlled = memberPosition === 0 && isQueueControlled && !Permission.isChannelMod(memberPermission);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === memberUserId && f.relationStatus === 2), [friends, memberUserId]);
  const isSuperior = permissionLevel > memberPermission;
  const memberHasVip = memberVip > 0;

  // Handlers
  const getStatusIcon = () => {
    if (isMuted || isMemberVoiceMuted || isControlled) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () => Popup.terminateMember(memberUserId, currentServerId, memberName))
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId: currentChannelCategoryId }, () =>
        Permission.isChannelMod(memberPermission)
          ? Popup.editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId: currentChannelCategoryId }, () =>
        Permission.isChannelAdmin(memberPermission)
          ? Popup.editChannelPermission(memberUserId, currentServerId, currentChannelCategoryId || currentChannelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(memberUserId, currentServerId, currentChannelCategoryId || currentChannelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () =>
        Permission.isServerAdmin(memberPermission)
          ? Popup.editServerPermission(memberUserId, currentServerId, { permissionLevel: 2 })
          : Popup.editServerPermission(memberUserId, currentServerId, { permissionLevel: 5 }),
      )
      .build();

  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addIncreaseQueueTimeOption({ queuePosition: memberPosition, permissionLevel }, () => Popup.increaseUserQueueTime(memberUserId, currentServerId, currentChannelId))
      .addMoveUpQueueOption({ queuePosition: memberPosition, permissionLevel }, () => Popup.moveUserQueuePositionUp(memberUserId, currentServerId, currentChannelId, memberPosition - 1))
      .addMoveDownQueueOption({ queuePosition: memberPosition, queueLength: queueMembers.length, permissionLevel }, () =>
        Popup.moveUserQueuePositionDown(memberUserId, currentServerId, currentChannelId, memberPosition + 1),
      )
      .addRemoveFromQueueOption({ permissionLevel }, () => Popup.removeUserFromQueue(memberUserId, currentServerId, currentChannelId, memberNickname || memberName))
      .addClearQueueOption({ permissionLevel }, () => Popup.clearQueue(currentServerId, currentChannelId))
      .addSeparator()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, memberUserId))
      .addViewProfileOption(() => Popup.openUserInfo(userId, memberUserId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(userId, memberUserId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? unmuteUser(memberUserId) : muteUser(memberUserId)))
      .addEditNicknameOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openEditNickname(memberUserId, currentServerId))
      .addSeparator()
      .addForbidVoiceOption({ isSelf, isSuperior, isVoiceMuted: isMemberVoiceMuted }, () => Popup.forbidUserVoiceInChannel(memberUserId, currentServerId, currentChannelId, !isMemberVoiceMuted))
      .addForbidTextOption({ isSelf, isSuperior, isTextMuted: isMemberTextMuted }, () => Popup.forbidUserTextInChannel(memberUserId, currentServerId, currentChannelId, !isMemberTextMuted))
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isSuperior, isInLobby }, () => Popup.openKickMemberFromChannel(memberUserId, currentServerId, currentChannelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openKickMemberFromServer(memberUserId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(memberUserId, currentServerId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel }, () => Popup.terminateMember(userId, currentServerId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior }, () => Popup.openInviteMember(memberUserId, currentServerId))
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: memberPermission, isSelf, isSuperior, channelCategoryId: currentChannelCategoryId },
        () => {},
        getMemberManagementSubmenuItems(),
      )
      .build();

  const muteUser = (userId: Types.User['userId']) => {
    webRTC.muteUser(userId);
  };

  const unmuteUser = (userId: Types.User['userId']) => {
    webRTC.unmuteUser(userId);
  };

  return (
    <div
      className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `queue-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `queue-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`queue-${memberUserId}`);
      }}
      onMouseEnter={(e) => {
        const { right: x, top: y } = e.currentTarget.getBoundingClientRect();
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          contextMenu.showUserInfoBlock(x, y, 'right-bottom', queueMember);
        }, 200);
      }}
      onMouseLeave={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const { clientX: x, clientY: y } = e;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[getStatusIcon()]}`} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      <div className={`${styles['user-queue-position']}`}>{memberPosition + 1}.</div>
      {memberHasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberHasVip ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;
