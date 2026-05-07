import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { increaseUserQueueTime, moveUserQueuePositionUp, moveUserQueuePositionDown, removeUserFromQueue, clearQueue, openDirectMessage, openUserInfo, openApplyFriend, openEditNickname, forbidUserVoiceInChannel, forbidUserTextInChannel, openKickMemberFromChannel, openKickMemberFromServer, openBlockMember, terminateMember, openInviteMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

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
        .addIncreaseQueueTimeOption({ queuePosition: queueMember.position, permissionLevel }, () => increaseUserQueueTime(queueMember.userId, currentServer.serverId, currentChannel.channelId))
        .addMoveUpQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          moveUserQueuePositionUp(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position - 1),
        )
        .addMoveDownQueueOption({ queuePosition: queueMember.position, permissionLevel }, () =>
          moveUserQueuePositionDown(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.position + 1),
        )
        .addRemoveFromQueueOption({ permissionLevel }, () => removeUserFromQueue(queueMember.userId, currentServer.serverId, currentChannel.channelId, queueMember.name))
        .addClearQueueOption({ permissionLevel }, () => clearQueue(currentServer.serverId, currentChannel.channelId))
        .addSeparator()
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(user.userId, queueMember.userId))
        .addViewProfileOption(() => openUserInfo(user.userId, queueMember.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(user.userId, queueMember.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(queueMember.userId) : onMuteUser(queueMember.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: queueMember.isVoiceMuted }, () =>
          forbidUserVoiceInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: queueMember.isTextMuted }, () =>
          forbidUserTextInChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId, !queueMember.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () =>
          openKickMemberFromChannel(queueMember.userId, currentServer.serverId, currentChannel.channelId),
        )
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(queueMember.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(queueMember.userId, currentServer.serverId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(user.userId, currentServer.serverId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () =>
          openInviteMember(queueMember.userId, currentServer.serverId),
        )
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: queueMember.permissionLevel, isSelf, isLowerLevel }, () => { }, buildMemberManagementSubmenu())
        .build(),
    [user, currentServer, currentChannel, queueMember, isMuted, isFriend, permissionLevel, isSelf, isLowerLevel, isInLobby, t, onMuteUser, onUnmuteUser, buildMemberManagementSubmenu],
  );

  return { buildContextMenu };
};
