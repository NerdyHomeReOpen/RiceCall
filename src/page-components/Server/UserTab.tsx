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
  userCanJoinChannel: boolean;
  channelNeedsPassword: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ member, channel, userCanJoinChannel, channelNeedsPassword }) => {
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
  const memberIsInQueue = useAppSelector((state) => state.queueUsers.data.some((qu) => qu.userId === member.userId));
  const memberIsSpeaking = useAppSelector((state) => (member.userId === userId ? !!state.webrtc.speakingUserIdList['user'] : !!state.webrtc.speakingUserIdList[member.userId]));
  const memberIsMuted = useAppSelector((state) => !!state.webrtc.mutedUserIdList[member.userId]);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `user-${member.userId}`);

  const memberIsSelf = member.userId === userId;
  const memberIsFriend = friends.some((f) => f.targetId === member.userId && f.relationStatus === 2);
  const memberHasLowerLevel = member.permissionLevel < permissionLevel;
  const memberIsInSameChannel = member.currentChannelId === currentChannelId;
  const memberIsInLobby = member.currentChannelId === currentServerLobbyId;
  const memberHasEqualOrLowerLevel = member.permissionLevel <= permissionLevel;
  const memberHasVip = member.vip > 0;
  const channelIsSubChannel = !!channel.categoryId;
  const channelIsQueueMode = channel.voiceMode === 'queue';
  const isDraggable = !memberIsSelf && memberHasLowerLevel && permissionLevel >= Types.Permission.ChannelMod;

  const getStatusIcon = () => {
    if (memberIsMuted || member.isVoiceMuted) return 'muted';
    if (memberIsSpeaking) return 'play';
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
    if (memberIsSelf) return;
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
          targetIsSelf: memberIsSelf,
          targetIsInSameChannel: memberIsInSameChannel,
        },
        () => {
          connectChannel(currentServerId, channel.channelId, userCanJoinChannel, channelNeedsPassword);
        },
      )
      .addAddToQueueOption(
        {
          permissionLevel,
          channelIsQueueMode,
          targetIsSelf: memberIsSelf,
          targetHasEqualOrLowerLevel: memberHasEqualOrLowerLevel,
          targetIsInQueue: memberIsInQueue,
        },
        () => {
          addUserToQueue(member.userId, currentServerId, channel.channelId);
        },
      )
      .addDirectMessageOption(
        {
          targetIsSelf: memberIsSelf,
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
          targetIsSelf: memberIsSelf,
          targetIsFriend: memberIsFriend,
        },
        () => {
          openApplyFriend(userId, member.userId);
        },
      )
      .addSetMuteOption(
        {
          targetIsSelf: memberIsSelf,
          targetIsMuted: memberIsMuted,
        },
        () => {
          if (memberIsMuted) unmuteUser(member.userId);
          else muteUser(member.userId);
        },
      )
      .addEditNicknameOptionWithNoIcon(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
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
          targetIsSelf: memberIsSelf,
          targetIsInSameChannel: memberIsInSameChannel,
          targetHasEqualOrLowerLevel: memberHasEqualOrLowerLevel,
        },
        () => moveUserToChannel(member.userId, currentServerId, currentChannelId),
      )
      .addSeparator()
      .addForbidVoiceOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
          targetIsVoiceMuted: member.isVoiceMuted,
        },
        () => forbidUserVoiceInChannel(member.userId, currentServerId, channel.channelId, !member.isVoiceMuted),
      )
      .addForbidTextOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
          targetIsTextMuted: member.isTextMuted,
        },
        () => forbidUserTextInChannel(member.userId, currentServerId, channel.channelId, !member.isTextMuted),
      )
      .addKickUserFromChannelOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
          targetIsInLobby: memberIsInLobby,
        },
        () => openKickMemberFromChannel(member.userId, currentServerId, channel.channelId),
      )
      .addKickUserFromServerOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
        },
        () => {
          openKickMemberFromServer(member.userId, currentServerId);
        },
      )
      .addBlockUserFromServerOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
        },
        () => {
          openBlockMember(member.userId, currentServerId);
        },
      )
      .addSeparator()
      .addTerminateSelfMembershipOption(
        {
          permissionLevel,
          targetIsSelf: memberIsSelf,
        },
        () => {
          terminateMember(userId, currentServerId, t('self'));
        },
      )
      .addInviteToBeMemberOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
        },
        () => {
          openInviteMember(member.userId, currentServerId);
        },
      )
      .addMemberManagementOption(
        {
          permissionLevel,
          targetPermissionLevel: member.permissionLevel,
          targetIsSelf: memberIsSelf,
          targetHasLowerLevel: memberHasLowerLevel,
        },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
              targetIsSelf: memberIsSelf,
              targetHasLowerLevel: memberHasLowerLevel,
            },
            () => {
              terminateMember(member.userId, currentServerId, member.name);
            },
          )
          .addSetChannelModOption(
            {
              permissionLevel,
              targetPermissionLevel: member.permissionLevel,
              targetIsSelf: memberIsSelf,
              targetHasLowerLevel: memberHasLowerLevel,
              channelIsSubChannel,
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
              targetIsSelf: memberIsSelf,
              targetHasLowerLevel: memberHasLowerLevel,
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
              targetIsSelf: memberIsSelf,
              targetHasLowerLevel: memberHasLowerLevel,
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
    if (memberIsSelf) setCurrentUserRef(userTabEl.current);
  }, [memberIsSelf, setCurrentUserRef]);

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
      {memberIsSelf && <div className={styles['my-location-icon']} />}
    </div>
  );
});

UserTab.displayName = 'UserTab';

export default UserTab;
