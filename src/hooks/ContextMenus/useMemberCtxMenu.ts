import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import {
  connectChannel,
  addUserToQueue,
  openDirectMessage,
  openUserInfo,
  openApplyFriend,
  openEditNickname,
  moveUserToChannel,
  forbidUserVoiceInChannel,
  forbidUserTextInChannel,
  openKickMemberFromChannel,
  openKickMemberFromServer,
  openBlockMember,
  terminateMember,
  openInviteMember,
} from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { useMemberManagementCtxMenu } from './useMemberManagementCtxMenu';

interface UseMemberCtxMenuProps {
  userId: Types.User['userId'];
  userPermissionLevel: Types.User['permissionLevel'];
  currentServerId: Types.Server['serverId'];
  currentServerPermissionLevel: Types.Server['permissionLevel'];
  currentServerLobbyId: Types.Server['lobbyId'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelPermissionLevel: Types.Channel['permissionLevel'];
  currentChannelCategoryId: Types.Channel['categoryId'];
  channelId: Types.Channel['channelId'];
  channelPermissionLevel: Types.Channel['permissionLevel'];
  memberUserId: Types.Member['userId'];
  memberPermissionLevel: Types.Member['permissionLevel'];
  memberName: Types.Member['name'];
  memberCurrentChannelId: Types.Member['currentChannelId'];
  memberIsVoiceMuted: boolean;
  memberIsTextMuted: boolean;
  isMuted: boolean;
  isFriend: boolean;
  isInQueue: boolean;
  isChannelQueueMode: boolean;
  canJoin: boolean;
  isPasswordNeeded: boolean;
  onMuteUser: (userId: string) => void;
  onUnmuteUser: (userId: string) => void;
}

export const useMemberCtxMenu = (props: UseMemberCtxMenuProps) => {
  const { t } = useTranslation();

  const {
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    channelId,
    channelPermissionLevel,
    memberUserId,
    memberPermissionLevel,
    memberCurrentChannelId,
    memberIsVoiceMuted,
    memberIsTextMuted,
    isMuted,
    isFriend,
    isInQueue,
    isChannelQueueMode,
    canJoin,
    isPasswordNeeded,
    onMuteUser,
    onUnmuteUser,
  } = props;
  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, channelPermissionLevel);
  const currentPermissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = memberUserId === userId;
  const isLowerLevel = memberPermissionLevel < permissionLevel;
  const isEqualOrLowerLevel = memberPermissionLevel <= permissionLevel;
  const isInSameChannel = memberCurrentChannelId === currentChannelId;
  const isInLobby = memberCurrentChannelId === currentServerLobbyId;

  const { buildMemberManagementCtxMenu } = useMemberManagementCtxMenu(props);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => connectChannel(currentServerId, channelId, canJoin, isPasswordNeeded))
        .addAddToQueueOption({ permissionLevel, isSelf, isEqualOrLowerLevel, isChannelQueueMode, isInQueue }, () => addUserToQueue(memberUserId, currentServerId, channelId))
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, memberUserId))
        .addViewProfileOption(() => openUserInfo(userId, memberUserId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(userId, memberUserId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(memberUserId) : onMuteUser(memberUserId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(memberUserId, currentServerId))
        .addSeparator()
        .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrLowerLevel }, () => moveUserToChannel(memberUserId, currentServerId, currentChannelId))
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: memberIsVoiceMuted }, () =>
          forbidUserVoiceInChannel(memberUserId, currentServerId, channelId, !memberIsVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: memberIsTextMuted }, () => forbidUserTextInChannel(memberUserId, currentServerId, channelId, !memberIsTextMuted))
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(memberUserId, currentServerId, channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(memberUserId, currentServerId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(memberUserId, currentServerId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(userId, currentServerId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => openInviteMember(memberUserId, currentServerId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementCtxMenu())
        .build(),
    [
      userId,
      currentServerId,
      currentChannelId,
      channelId,
      memberUserId,
      memberPermissionLevel,
      memberIsVoiceMuted,
      memberIsTextMuted,
      isMuted,
      isFriend,
      isInQueue,
      isChannelQueueMode,
      canJoin,
      isPasswordNeeded,
      permissionLevel,
      currentPermissionLevel,
      isSelf,
      isLowerLevel,
      isEqualOrLowerLevel,
      isInSameChannel,
      isInLobby,
      t,
      onMuteUser,
      onUnmuteUser,
      buildMemberManagementCtxMenu,
    ],
  );

  return { buildContextMenu };
};
