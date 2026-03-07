import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';
import { useMemberManagementSubmenu } from '@/hooks/ctxMenus/memberManagementSubmenu';

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
  // Hooks
  const { t } = useTranslation();

  // Variables
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
      new CtxMenuBuilder()
        .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => Action.increaseUserQueueTime(queueMember.userId, currentServer.serverId, currentChannel.channelId))
        .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          Action.moveUserQueuePositionUp(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position - 1),
        )
        .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          Action.moveUserQueuePositionDown(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position + 1),
        )
        .addRemoveFromQueueOption({ permissionLevel }, () => Action.removeUserFromQueue(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.name))
        .addClearQueueOption({ permissionLevel }, () => Action.clearQueue(currentServer.serverId, currentChannel.channelId))
        .addSeparator()
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, queueMember.userId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, queueMember.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => Action.openApplyFriend(user.userId, queueMember.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(queueMember.userId) : onMuteUser(queueMember.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => Action.openEditNickname(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
          Action.forbidUserVoiceInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
          Action.forbidUserTextInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () =>
          Action.openKickMemberFromChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId),
        )
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openKickMemberFromServer(queueMember.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => Action.terminateMember(user.userId, currentServer.serverId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
          Action.openInviteMember(queueMember.userId, currentServer.serverId),
        )
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementSubmenu())
        .build(),
    [user, currentServer, currentChannel, queueMember, isMuted, isFriend, permissionLevel, isSelf, isLowerLevel, isInLobby, t, onMuteUser, onUnmuteUser, buildMemberManagementSubmenu],
  );

  return { buildContextMenu };
};
