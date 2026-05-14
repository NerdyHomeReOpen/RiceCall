import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { connectChannel, addUserToQueue, openDirectMessage, openUserInfo, openApplyFriend, openEditNickname, moveUserToChannel, forbidUserVoiceInChannel, forbidUserTextInChannel, openKickMemberFromChannel, openKickMemberFromServer, openBlockMember, terminateMember, openInviteMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { useMemberManagementCtxMenu } from './useMemberManagementCtxMenu';

interface UseMemberCtxMenuProps {
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

export const useMemberCtxMenu = ({
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
}: UseMemberCtxMenuProps) => {
  const { t } = useTranslation();

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isEqualOrLowerLevel = member.permissionLevel <= permissionLevel;
  const isInSameChannel = member.currentChannelId === currentChannel.channelId;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementCtxMenu } = useMemberManagementCtxMenu({ user, currentServer, channel, member });

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinUserChannelOption({ isSelf, isInSameChannel }, () => connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded))
        .addAddToQueueOption({ permissionLevel, isSelf, isEqualOrLowerLevel, isChannelQueueMode, isInQueue }, () => addUserToQueue(member.userId, currentServer.serverId, channel.channelId))
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => openUserInfo(user.userId, member.userId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(user.userId, member.userId))
        .addSetMuteOption({ isSelf, isMuted }, () => (isMuted ? onUnmuteUser(member.userId) : onMuteUser(member.userId)))
        .addEditNicknameOptionWithNoIcon({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(member.userId, currentServer.serverId))
        .addSeparator()
        .addMoveToChannelOption({ currentPermissionLevel, permissionLevel, isSelf, isInSameChannel, isEqualOrLowerLevel }, () =>
          moveUserToChannel(member.userId, currentServer.serverId, currentChannel.channelId),
        )
        .addSeparator()
        .addForbidVoiceOption({ permissionLevel, isSelf, isLowerLevel, isVoiceMuted: member.isVoiceMuted }, () =>
          forbidUserVoiceInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isVoiceMuted),
        )
        .addForbidTextOption({ permissionLevel, isSelf, isLowerLevel, isTextMuted: member.isTextMuted }, () =>
          forbidUserTextInChannel(member.userId, currentServer.serverId, channel.channelId, !member.isTextMuted),
        )
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(member.userId, currentServer.serverId, channel.channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(member.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(member.userId, currentServer.serverId))
        .addSeparator()
        .addTerminateSelfMembershipOption({ permissionLevel, isSelf }, () => terminateMember(user.userId, currentServer.serverId, t('self')))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => openInviteMember(member.userId, currentServer.serverId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => { }, buildMemberManagementCtxMenu())
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
      buildMemberManagementCtxMenu,
    ],
  );

  return { buildContextMenu };
};
