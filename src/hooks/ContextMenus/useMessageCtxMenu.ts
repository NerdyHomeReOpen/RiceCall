import { useCallback } from 'react';

import type * as Types from '@/types';

import { openDirectMessage, openUserInfo, openKickMemberFromChannel, openKickMemberFromServer, openBlockMember, openInviteMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { useMemberManagementCtxMenu } from '@/hooks/ContextMenus/useMemberManagementCtxMenu';

interface UseMessageCtxMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel' | 'categoryId'>;
  member: Pick<Types.ChannelMessage, 'userId' | 'permissionLevel' | 'name' | 'currentChannelId'>;
}

export const useMessageCtxMenu = ({ user, currentServer, currentChannel, member }: UseMessageCtxMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementCtxMenu } = useMemberManagementCtxMenu({ user, currentServer, channel: currentChannel, member });

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => openUserInfo(user.userId, member.userId))
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(member.userId, currentServer.serverId, currentChannel.channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(member.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(member.userId, currentServer.serverId))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => openInviteMember(member.userId, currentServer.serverId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => { }, buildMemberManagementCtxMenu())
        .build(),
    [user, currentServer, currentChannel, member, permissionLevel, isSelf, isLowerLevel, isInLobby, buildMemberManagementCtxMenu],
  );

  return { buildContextMenu };
};
