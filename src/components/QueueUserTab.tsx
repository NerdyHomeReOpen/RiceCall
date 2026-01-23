import React, { useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import BadgeList from '@/components/BadgeList';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC, useWebRTCIsMuted, useWebRTCIsSpeaking } from '@/providers/WebRTC';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

interface QueueUserTabProps {
  queueUserId: string;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUserId }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { unmuteUser, muteUser } = useWebRTC();
  const isSpeaking = useWebRTCIsSpeaking(queueUserId);
  const isMuted = useWebRTCIsMuted(queueUserId);
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

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const queueMember = useMemo(() => {
    const onlineMember = onlineMembers.find((om) => om.userId === queueUserId);
    if (!onlineMember || !queueUser) return Default.queueMember();
    return { ...queueUser, ...onlineMember };
  }, [onlineMembers, queueUser, queueUserId]);
  const isSelf = queueMember.userId === user.userId;
  const isInLobby = queueMember.currentChannelId === currentServer.lobbyId;
  const hasVip = queueMember.vip > 0;
  const isOnMic = queueMember.position === 0;
  const isControlled = isOnMic && queueMember.isQueueControlled && !Permission.isChannelMod(permissionLevel);
  const isFriend = useMemo(() => friends.some((f) => f.targetId === queueMember.userId && f.relationStatus === 2), [friends, queueMember.userId]);
  const isLowerLevel = queueMember.permissionLevel < permissionLevel;

  // Functions
  const getStatusIcon = () => {
    if (isMuted || queueMember.isVoiceMuted || isControlled) return 'muted';
    if (isSpeaking) return 'play';
    return '';
  };

  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
        Popup.terminateMember(queueMember.userId, currentServer.serverId, queueMember.name),
      )
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId }, () =>
        Permission.isChannelMod(queueMember.permissionLevel)
          ? Popup.editChannelPermission(queueMember.userId, currentServer.serverId, currentChannel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(queueMember.userId, currentServer.serverId, currentChannel.channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId }, () =>
        Permission.isChannelAdmin(queueMember.permissionLevel)
          ? Popup.editChannelPermission(queueMember.userId, currentServer.serverId, currentChannel.categoryId || currentChannel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(queueMember.userId, currentServer.serverId, currentChannel.categoryId || currentChannel.channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
        Permission.isServerAdmin(queueMember.permissionLevel)
          ? Popup.editServerPermission(queueMember.userId, currentServer.serverId, { permissionLevel: 2 })
          : Popup.editServerPermission(queueMember.userId, currentServer.serverId, { permissionLevel: 5 }),
      )
      .build();

  const getTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => Popup.increaseUserQueueTime(queueMember.userId, currentServer.serverId, currentChannel.channelId))
      .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
        Popup.moveUserQueuePositionUp(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position - 1),
      )
      .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
        Popup.moveUserQueuePositionDown(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position + 1),
      )
      .addRemoveFromQueueOption({ permissionLevel }, () => Popup.removeUserFromQueue(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.name))
      .addClearQueueOption({ permissionLevel }, () => Popup.clearQueue(currentServer.serverId, currentChannel.channelId))
      .addSeparator()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, queueMember.userId))
      .addViewProfileOption(() => Popup.openUserInfo(user.userId, queueMember.userId))
      .addAddFriendOption({ isSelf, isFriend }, () => Popup.openApplyFriend(user.userId, queueMember.userId))
      .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? unmuteUser(queueMember.userId) : muteUser(queueMember.userId)))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openEditNickname(queueMember.userId, currentServer.serverId))
      .addSeparator()
      .addForbidVoiceOption({ isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
        Popup.forbidUserVoiceInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isVoiceMuted),
      )
      .addForbidTextOption({ isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
        Popup.forbidUserTextInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isTextMuted),
      )
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Popup.openKickMemberFromChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openKickMemberFromServer(queueMember.userId, currentServer.serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openBlockMember(queueMember.userId, currentServer.serverId))
      .addSeparator()
      .addTerminateSelfMembershipOption({ permissionLevel }, () => Popup.terminateMember(user.userId, currentServer.serverId, t('self')))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
        Popup.openInviteMember(queueMember.userId, currentServer.serverId),
      )
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId },
        () => {},
        getMemberManagementSubmenuItems(),
      )
      .build();

  // Handlers
  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`queue-${queueMember.userId}`));
  };

  const handleTabDoubleClick = () => {
    if (isSelf) return;
    Popup.openDirectMessage(user.userId, queueMember.userId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getTabContextMenuItems());
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
