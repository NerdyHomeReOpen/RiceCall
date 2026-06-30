import React, { useEffect, useRef } from 'react';
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
  canJoin: boolean;
  isPasswordNeeded: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, canJoin, isPasswordNeeded }) => {
  const { t } = useTranslation();
  const { showContextMenu, showUserInfoBlock } = useContextMenu();
  const { muteUser, unmuteUser } = useWebRTC();
  const { setCurrentUserRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userTabEl = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const userId = useAppSelector((state) => state.user.data.userId);
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const isMemberInQueue = useAppSelector((state) => state.queueUsers.data.some((qu) => qu.userId === member.userId));
  const isMemberSpeaking = useAppSelector((state) => (member.userId === userId ? !!state.webrtc.speakingUserIdList['user'] : !!state.webrtc.speakingUserIdList[member.userId]));
  const isMemberMuted = useAppSelector((state) => !!state.webrtc.mutedUserIdList[member.userId]);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `user-${member.userId}`);

  const isMemberSelf = member.userId === userId;
  const isMemberFriend = friends.some((f) => f.targetId === member.userId && f.relationStatus === 2);
  const isMemberHasLowerLevel = member.permissionLevel < permissionLevel;
  const isMemberInSameChannel = member.currentChannelId === currentChannelId;
  const isMemberInLobby = member.currentChannelId === currentServerLobbyId;
  const memberHasVip = member.vip > 0;
  const isChannelSubChannel = !!channel.categoryId;
  const isChannelQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !isMemberSelf && isMemberHasLowerLevel && permissionLevel >= Types.Permission.ChannelMod;

  const getStatusIcon = () => {
    if (isMemberMuted || member.isVoiceMuted) return 'muted';
    if (isMemberSpeaking) return 'play';
    return '';
  };

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`user-${member.userId}`));
    }
  };

  const handleTabDoubleClick = () => {
    if (isMemberSelf) return;
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
      .addJoinUserChannelOption(
        {
          isTargetSelf: isMemberSelf,
          isTargetInSameChannel: isMemberInSameChannel,
        },
        () => {
          connectChannel(currentServerId, channel.channelId, canJoin, isPasswordNeeded);
        },
      )
      .addAddToQueueOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isChannelQueueMode,
          isTargetSelf: isMemberSelf,
          isTargetInQueue: isMemberInQueue,
        },
        () => {
          addUserToQueue(member.userId, currentServerId, channel.channelId);
        },
      )
      .addDirectMessageOption(
        {
          isTargetSelf: isMemberSelf,
        },
        () => {
          openDirectMessage(userId, member.userId);
        },
      )
      .addViewProfileOption(() => {
        openUserInfo(userId, member.userId);
      })
      .addAddFriendOption(
        {
          isTargetSelf: isMemberSelf,
          isTargetFriend: isMemberFriend,
        },
        () => {
          openApplyFriend(userId, member.userId);
        },
      )
      .addSetMuteOption(
        {
          isTargetSelf: isMemberSelf,
          isTargetMuted: isMemberMuted,
        },
        () => {
          if (isMemberMuted) unmuteUser(member.userId);
          else muteUser(member.userId);
        },
      )
      .addEditNicknameOptionWithNoIcon(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openEditNickname(member.userId, currentServerId);
        },
      )
      .addSeparator()
      .addMoveToChannelOption(
        {
          permissionLevel,
          channelPermissionLevel: channel.permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetInSameChannel: isMemberInSameChannel,
        },
        () => moveUserToChannel(member.userId, currentServerId, currentChannelId),
      )
      .addSeparator()
      .addForbidVoiceOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetVoiceMuted: member.isVoiceMuted,
        },
        () => forbidUserVoiceInChannel(member.userId, currentServerId, channel.channelId, !member.isVoiceMuted),
      )
      .addForbidTextOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetTextMuted: member.isTextMuted,
        },
        () => forbidUserTextInChannel(member.userId, currentServerId, channel.channelId, !member.isTextMuted),
      )
      .addKickUserFromChannelOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
          isTargetInLobby: isMemberInLobby,
        },
        () => openKickMemberFromChannel(member.userId, currentServerId, channel.channelId),
      )
      .addKickUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openKickMemberFromServer(member.userId, currentServerId);
        },
      )
      .addBlockUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openBlockMember(member.userId, currentServerId);
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
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {
          openInviteMember(member.userId, currentServerId);
        },
      )
      .addMemberManagementOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          isTargetSelf: isMemberSelf,
        },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
              isTargetSelf: isMemberSelf,
            },
            () => {
              terminateMember(member.userId, currentServerId, member.name);
            },
          )
          .addSetChannelModOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
              isChannelSubChannel,
            },
            () => {
              if (member.permissionLevel >= Types.Permission.ChannelMod) editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              else editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 3 });
            },
          )
          .addSetChannelAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
            },
            () => {
              if (member.permissionLevel >= Types.Permission.ChannelAdmin) editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              else editChannelPermission(member.userId, currentServerId, currentChannelId, { permissionLevel: 4 });
            },
          )
          .addSetServerAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
            },
            () => {
              if (member.permissionLevel >= Types.Permission.ServerAdmin) editServerPermission(member.userId, currentServerId, { permissionLevel: 2 });
              else editServerPermission(member.userId, currentServerId, { permissionLevel: 5 });
            },
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

    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }

    hoverTimer.current = setTimeout(() => {
      showUserInfoBlock(x, y, 'right-bottom', member);
    }, 200);
  };

  const handleTabMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }

    hoverTimer.current = null;
  };

  useEffect(() => {
    if (isMemberSelf) setCurrentUserRef(userTabEl.current);
  }, [isMemberSelf, setCurrentUserRef]);

  return (
    <div
      ref={userTabEl}
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
      {memberHasVip && <div className={`vip-icon vip-${member.vip}`} />}
      <div className={`${styles['name-text']} ${member.nickname ? styles['member'] : ''} ${memberHasVip ? styles['vip'] : ''}`}>{member.nickname || member.name}</div>
      <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTitle={false} />
      <BadgeList badges={JSON.parse(member.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {isMemberSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
