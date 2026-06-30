import React, { useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import {
  clearQueue,
  editChannelPermission,
  editServerPermission,
  forbidUserTextInChannel,
  forbidUserVoiceInChannel,
  increaseUserQueueTime,
  moveUserQueuePositionDown,
  moveUserQueuePositionUp,
  openApplyFriend,
  openBlockMember,
  openDirectMessage,
  openEditNickname,
  openInviteMember,
  openKickMemberFromChannel,
  openKickMemberFromServer,
  openUserInfo,
  removeUserFromQueue,
  terminateMember,
} from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/BadgeList';

import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

import ContextMenu from '@/utils/contextMenu';
import { getDefaultQueueMember } from '@/utils';

import styles from './Server.module.css';

interface QueueUserTabProps {
  queueUserId: string;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUserId }) => {
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { unmuteUser, muteUser } = useWebRTC();
  const dispatch = useAppDispatch();

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const userId = useAppSelector((state) => state.user.data.userId);
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const isCurrentChannelSubChannel = useAppSelector((state) => !!state.currentChannel.data.categoryId);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const queueUser = useAppSelector((state) => state.queueUsers.data.find((qu) => qu.userId === queueUserId), shallowEqual);
  const isMemberSpeaking = useAppSelector((state) => (queueUserId === userId ? !!state.webrtc.speakingUserIdList['user'] : !!state.webrtc.speakingUserIdList[queueUserId]));
  const isMemberMuted = useAppSelector((state) => !!state.webrtc.mutedUserIdList[queueUserId]);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `queue-${queueUserId}`);

  const queueMember = useMemo(() => {
    const onlineMember = onlineMembers.find((om) => om.userId === queueUserId);
    if (!onlineMember || !queueUser) return getDefaultQueueMember();
    return { ...queueUser, ...onlineMember };
  }, [onlineMembers, queueUser, queueUserId]);

  const isMemberFriend = friends.some((f) => f.targetId === queueMember.userId && f.relationStatus === 2);
  const isMemberSelf = queueMember.userId === userId;
  const isMemberOnMic = queueMember.position === 0;
  const isMemberControlled = isMemberOnMic && queueMember.isQueueControlled && permissionLevel < Types.Permission.ChannelMod;
  const isMemberInLobby = queueMember.currentChannelId === currentServerLobbyId;
  const memberHasVip = queueMember.vip > 0;

  const getStatusIcon = () => {
    if (isMemberMuted || queueMember.isVoiceMuted || (permissionLevel < Types.Permission.ChannelMod && isMemberControlled)) return 'muted';
    if (isMemberSpeaking) return 'play';
    return '';
  };

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`queue-${queueMember.userId}`));
    }
  };

  const handleTabDoubleClick = () => {
    if (isMemberSelf) return;
    openDirectMessage(userId, queueMember.userId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addIncreaseQueueTimeOption(
        {
          permissionLevel,
          targetQueuePosition: queueMember.position,
        },
        () => {
          increaseUserQueueTime(queueMember.userId, currentServerId, currentChannelId);
        },
      )
      .addMoveUpQueueOption(
        {
          permissionLevel,
          targetQueuePosition: queueMember.position,
        },
        () => {
          moveUserQueuePositionUp(queueMember.userId, currentServerId, currentChannelId, queueMember.position - 1);
        },
      )
      .addMoveDownQueueOption(
        {
          permissionLevel,
          targetQueuePosition: queueMember.position,
        },
        () => {
          moveUserQueuePositionDown(queueMember.userId, currentServerId, currentChannelId, queueMember.position + 1);
        },
      )
      .addRemoveFromQueueOption(
        {
          permissionLevel,
        },
        () => {
          removeUserFromQueue(queueMember.userId, currentServerId, currentChannelId, queueMember.name);
        },
      )
      .addClearQueueOption(
        {
          permissionLevel,
        },
        () => {
          clearQueue(currentServerId, currentChannelId);
        },
      )
      .addSeparator()
      .addDirectMessageOption(
        {
          isTargetSelf: isMemberSelf,
        },
        () => {
          openDirectMessage(userId, queueMember.userId);
        },
      )
      .addViewProfileOption(() => {
        openUserInfo(userId, queueMember.userId);
      })
      .addAddFriendOption(
        {
          isTargetSelf: isMemberSelf,
          isTargetFriend: isMemberFriend,
        },
        () => {
          openApplyFriend(userId, queueMember.userId);
        },
      )
      .addSetMuteOption(
        {
          isTargetSelf: isMemberSelf,
          isTargetMuted: isMemberMuted,
        },
        () => {
          if (isMemberMuted) unmuteUser(queueMember.userId);
          else muteUser(queueMember.userId);
        },
      )
      .addEditNicknameOptionWithNoIcon(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openEditNickname(queueMember.userId, currentServerId);
        },
      )
      .addSeparator()
      .addForbidVoiceOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetVoiceMuted: queueMember.isVoiceMuted,
        },
        () => {
          forbidUserVoiceInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isVoiceMuted);
        },
      )
      .addForbidTextOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetTextMuted: queueMember.isTextMuted,
        },
        () => {
          forbidUserTextInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isTextMuted);
        },
      )
      .addKickUserFromChannelOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetInLobby: isMemberInLobby,
        },
        () => {
          openKickMemberFromChannel(queueMember.userId, currentServerId, currentChannelId);
        },
      )
      .addKickUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openKickMemberFromServer(queueMember.userId, currentServerId);
        },
      )
      .addBlockUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openBlockMember(queueMember.userId, currentServerId);
        },
      )
      .addSeparator()
      .addTerminateSelfMembershipOption(
        {
          permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          terminateMember(userId, currentServerId, t('self'));
        },
      )
      .addInviteToBeMemberOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openInviteMember(queueMember.userId, currentServerId);
        },
      )
      .addMemberManagementOption(
        {
          permissionLevel,
          targetPermissionLevel: queueMember.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption(
            {
              permissionLevel,
              targetPermissionLevel: queueMember.permissionLevel,
              isTargetSelf: isMemberSelf,
            },
            () => {
              terminateMember(queueMember.userId, currentServerId, queueMember.name);
            },
          )
          .addSetChannelModOption(
            {
              permissionLevel,
              targetPermissionLevel: queueMember.permissionLevel,
              isChannelSubChannel: isCurrentChannelSubChannel,
            },
            () => {
              if (queueMember.permissionLevel >= Types.Permission.ChannelMod) editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              else editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 3 });
            },
          )
          .addSetChannelAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: queueMember.permissionLevel,
            },
            () => {
              if (queueMember.permissionLevel >= Types.Permission.ChannelAdmin) editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              else editChannelPermission(queueMember.userId, currentServerId, currentChannelId, { permissionLevel: 4 });
            },
          )
          .addSetServerAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: queueMember.permissionLevel,
            },
            () => {
              if (queueMember.permissionLevel >= Types.Permission.ServerAdmin) editServerPermission(queueMember.userId, currentServerId, { permissionLevel: 2 });
              else editServerPermission(queueMember.userId, currentServerId, { permissionLevel: 5 });
            },
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleTabMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const { right: x, top: y } = e.currentTarget.getBoundingClientRect();

    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }

    hoverTimer.current = setTimeout(() => {
      showUserInfoBlock(x, y, 'right-bottom', queueMember);
    }, 200);
  };

  const handleTabMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }

    hoverTimer.current = null;
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
      {memberHasVip && <div className={`vip-icon vip-${queueMember.vip}`} />}
      <div className={`${styles['name-text']} ${queueMember.nickname ? styles['member'] : ''} ${memberHasVip ? styles['vip'] : ''}`}>{queueMember.nickname || queueMember.name}</div>
      <BadgeList badges={JSON.parse(queueMember.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isMemberOnMic && <div className={styles['time-remaining']}>{queueMember.leftTime}s</div>}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;
