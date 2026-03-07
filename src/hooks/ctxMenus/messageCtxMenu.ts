import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';
import { useMemberManagementSubmenu } from '@/hooks/ctxMenus/memberManagementSubmenu';

interface UseMessageContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel' | 'categoryId'>;
  member: Pick<Types.ChannelMessage, 'userId' | 'permissionLevel' | 'name' | 'currentChannelId'>;
}

export const useMessageContextMenu = ({ user, currentServer, currentChannel, member }: UseMessageContextMenuProps) => {
  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;
  const isInLobby = member.currentChannelId === currentServer.lobbyId;

  const { buildMemberManagementSubmenu } = useMemberManagementSubmenu({ user, currentServer, channel: currentChannel, member });

  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, member.userId))
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Action.openKickMemberFromChannel(member.userId, currentServer.serverId, currentChannel.channelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openKickMemberFromServer(member.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(member.userId, currentServer.serverId))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => Action.openInviteMember(member.userId, currentServer.serverId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementSubmenu())
        .build(),
    [user, currentServer, currentChannel, member, permissionLevel, isSelf, isLowerLevel, isInLobby, buildMemberManagementSubmenu],
  );

  return { buildContextMenu };
};
