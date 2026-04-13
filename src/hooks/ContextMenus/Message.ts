import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';
import { useMemberManagementSubmenu } from '@/hooks/ContextMenus/MemberManagementSubmenu';

interface UseMessageContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel' | 'categoryId'>;
  member: Pick<Types.ChannelMessage, 'userId' | 'permissionLevel' | 'name' | 'currentChannelId'>;
}

export const useMessageContextMenu = ({ user, currentServer, currentChannel, member }: UseMessageContextMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementSubmenu } = useMemberManagementSubmenu({ user, currentServer, channel: currentChannel, member });

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => Actions.openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, member.userId))
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Actions.openKickMemberFromChannel(member.userId, currentServer.serverId, currentChannel.channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openKickMemberFromServer(member.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openBlockMember(member.userId, currentServer.serverId))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => Actions.openInviteMember(member.userId, currentServer.serverId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementSubmenu())
        .build(),
    [user, currentServer, currentChannel, member, permissionLevel, isSelf, isLowerLevel, isInLobby, buildMemberManagementSubmenu],
  );

  return { buildContextMenu };
};
