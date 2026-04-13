import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';
import { useMemberManagementSubmenu } from '@/hooks/ContextMenus/MemberManagementSubmenu';

interface UseQueueUserContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel' | 'categoryId'>;
  queueMember: Pick<Types.QueueMember, 'userId' | 'permissionLevel' | 'name' | 'currentChannelId' | 'isVoiceMuted' | 'isTextMuted' | 'position'>;
  isMuted: boolean;
  isFriend: boolean;
  onMuteUser: (userId: string) => void;
  onUnmuteUser: (userId: string) => void;
}

export const useQueueUserContextMenu = ({ user, currentServer, currentChannel, queueMember, isMuted, isFriend, onMuteUser, onUnmuteUser }: UseQueueUserContextMenuProps) => {
  const { t } = useTranslation();

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = queueMember.userId === user.userId;
  const isLowerLevel = queueMember.permissionLevel < permissionLevel;
  const isInLobby = queueMember.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementSubmenu } = useMemberManagementSubmenu({
    user,
    currentServer,
    channel: currentChannel,
    member: queueMember,
  });

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => Actions.increaseUserQueueTime(queueMember.userId, currentServer.serverId, currentChannel.channelId))
        .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          Actions.moveUserQueuePositionUp(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position - 1),
        )
        .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          Actions.moveUserQueuePositionDown(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position + 1),
        )
        .addRemoveFromQueueOption({ permissionLevel }, () => Actions.removeUserFromQueue(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.name))
        .addClearQueueOption({ permissionLevel }, () => Actions.clearQueue(currentServer.serverId, currentChannel.channelId))
        .addSeparator()
        .addDirectMessageOption({ isSelf }, () => Actions.openDirectMessage(user.userId, queueMember.userId))
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, queueMember.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => Actions.openApplyFriend(user.userId, queueMember.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(queueMember.userId) : onMuteUser(queueMember.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openEditNickname(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
          Actions.forbidUserVoiceInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
          Actions.forbidUserTextInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () =>
          Actions.openKickMemberFromChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId),
        )
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openKickMemberFromServer(queueMember.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openBlockMember(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => Actions.terminateMember(user.userId, currentServer.serverId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
          Actions.openInviteMember(queueMember.userId, currentServer.serverId),
        )
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementSubmenu())
        .build(),
    [user, currentServer, currentChannel, queueMember, isMuted, isFriend, permissionLevel, isSelf, isLowerLevel, isInLobby, t, onMuteUser, onUnmuteUser, buildMemberManagementSubmenu],
  );

  return { buildContextMenu };
};
