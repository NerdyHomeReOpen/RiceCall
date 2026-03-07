import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';
import { useMemberManagementSubmenu } from '@/hooks/ctxMenus/memberManagementSubmenu';

interface UseMemberContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel'>;
  channel: Pick<Types.Channel | Types.Category, 'channelId' | 'permissionLevel' | 'categoryId'>;
  member: Pick<Types.OnlineMember, 'userId' | 'permissionLevel' | 'name' | 'currentChannelId' | 'isVoiceMuted' | 'isTextMuted'>;
  isMuted: boolean;
  isFriend: boolean;
  isInQueue: boolean;
  isChannelQueueMode: boolean;
  canJoin: boolean;
  isPasswordNeeded: boolean;
  onMuteUser: (userId: string) => void;
  onUnmuteUser: (userId: string) => void;
}

export const useMemberContextMenu = ({
  member,
  channel,
  user,
  currentServer,
  currentChannel,
  isMuted,
  isFriend,
  isInQueue,
  isChannelQueueMode,
  canJoin,
  isPasswordNeeded,
  onMuteUser,
  onUnmuteUser,
}: UseMemberContextMenuProps) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isEqualOrLowerLevel = member.permissionLevel <= permissionLevel;
  const isInSameChannel = member.currentChannelId === currentChannel.channelId;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementSubmenu } = useMemberManagementSubmenu({ user, currentServer, channel, member });

  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => Action.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded))
        .addAddToQueueOption({ permissionLevel, isSelf, isEqualOrLowerLevel, isChannelQueueMode, isInQueue }, () => Action.addUserToQueue(member.userId, currentServer.serverId, channel.channelId))
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, member.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => Action.openApplyFriend(user.userId, member.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(member.userId) : onMuteUser(member.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => Action.openEditNickname(member.userId, currentServer.serverId))
        .addSeparator()
        .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrLowerLevel }, () =>
          Action.moveUserToChannel(member.userId, currentServer.serverId, currentChannel.channelId),
        )
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: member.isVoiceMuted }, () =>
          Action.forbidUserVoiceInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: member.isTextMuted }, () =>
          Action.forbidUserTextInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Action.openKickMemberFromChannel(member.userId, currentServer.serverId, channel.channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openKickMemberFromServer(member.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(member.userId, currentServer.serverId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => Action.terminateMember(user.userId, currentServer.serverId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => Action.openInviteMember(member.userId, currentServer.serverId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementSubmenu())
        .build(),
    [
      member,
      channel,
      user,
      currentServer,
      currentChannel,
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
      buildMemberManagementSubmenu,
    ],
  );

  return { buildContextMenu };
};
