import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import {
  increaseUserQueueTime,
  moveUserQueuePositionUp,
  moveUserQueuePositionDown,
  removeUserFromQueue,
  clearQueue,
  openDirectMessage,
  openUserInfo,
  openApplyFriend,
  openEditNickname,
  forbidUserVoiceInChannel,
  forbidUserTextInChannel,
  openKickMemberFromChannel,
  openKickMemberFromServer,
  openBlockMember,
  terminateMember,
  openInviteMember,
} from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { useMemberManagementCtxMenu } from '@/hooks/ContextMenus/useMemberManagementCtxMenu';

interface UseQueueUserCtxMenuProps {
  userId: Types.User['userId'];
  userPermissionLevel: Types.User['permissionLevel'];
  currentServerId: Types.Server['serverId'];
  currentServerPermissionLevel: Types.Server['permissionLevel'];
  currentServerLobbyId: Types.Server['lobbyId'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelPermissionLevel: Types.Channel['permissionLevel'];
  currentChannelCategoryId: Types.Channel['categoryId'];
  queueMember: Types.QueueMember;
  isMuted: boolean;
  isFriend: boolean;
  onMuteUser: (userId: string) => void;
  onUnmuteUser: (userId: string) => void;
}

export const useQueueUserCtxMenu = (props: UseQueueUserCtxMenuProps) => {
  const { t } = useTranslation();

  const {
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    currentChannelCategoryId,
    queueMember,
    isMuted,
    isFriend,
    onMuteUser,
    onUnmuteUser,
  } = props;
  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = queueMember.userId === userId;
  const isLowerLevel = queueMember.permissionLevel < permissionLevel;
  const isInLobby = queueMember.currentChannelId === currentServerLobbyId;

  const { buildMemberManagementCtxMenu } = useMemberManagementCtxMenu({
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentChannelId,
    currentChannelPermissionLevel,
    currentChannelCategoryId,
    memberUserId: queueMember.userId,
    memberPermissionLevel: queueMember.permissionLevel,
    memberName: queueMember.name,
  });

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => increaseUserQueueTime(queueMember.userId, currentServerId, currentChannelId))
        .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () => moveUserQueuePositionUp(queueMember.userId, currentServerId, currentChannelId, queueMember.position - 1))
        .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          moveUserQueuePositionDown(queueMember.userId, currentServerId, currentChannelId, queueMember.position + 1),
        )
        .addRemoveFromQueueOption({ permissionLevel }, () => removeUserFromQueue(queueMember.userId, currentServerId, currentChannelId, queueMember.name))
        .addClearQueueOption({ permissionLevel }, () => clearQueue(currentServerId, currentChannelId))
        .addSeparator()
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, queueMember.userId))
        .addViewProfileOption(() => openUserInfo(userId, queueMember.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(userId, queueMember.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(queueMember.userId) : onMuteUser(queueMember.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(queueMember.userId, currentServerId))
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
          forbidUserVoiceInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
          forbidUserTextInChannel(queueMember.userId, currentServerId, currentChannelId, !queueMember.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(queueMember.userId, currentServerId, currentChannelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(queueMember.userId, currentServerId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(queueMember.userId, currentServerId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(userId, currentServerId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => openInviteMember(queueMember.userId, currentServerId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementCtxMenu())
        .build(),
    [userId, currentServerId, currentChannelId, queueMember, isMuted, isFriend, permissionLevel, isSelf, isLowerLevel, isInLobby, t, onMuteUser, onUnmuteUser, buildMemberManagementCtxMenu],
  );

  return { buildContextMenu };
};
