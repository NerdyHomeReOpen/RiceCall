import { useCallback } from 'react';

import * as Types from '@/types';

import { openDirectMessage, openUserInfo, openKickMemberFromChannel, openKickMemberFromServer, openBlockMember, openInviteMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { useMemberManagementCtxMenu } from '@/hooks/ContextMenus/useMemberManagementCtxMenu';

interface UseMessageCtxMenuProps {
  userId: Types.User['userId'];
  userPermissionLevel: Types.User['permissionLevel'];
  currentServerId: Types.Server['serverId'];
  currentServerPermissionLevel: Types.Server['permissionLevel'];
  currentServerLobbyId: Types.Server['lobbyId'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelPermissionLevel: Types.Channel['permissionLevel'];
  currentChannelCategoryId: Types.Channel['categoryId'];
  memberUserId: Types.Member['userId'];
  memberPermissionLevel: Types.Member['permissionLevel'];
  memberName: Types.Member['name'];
  memberCurrentChannelId: Types.Member['currentChannelId'];
}

export const useMessageCtxMenu = (props: UseMessageCtxMenuProps) => {
  const {
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    memberUserId,
    memberPermissionLevel,
    memberCurrentChannelId,
  } = props;

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = memberUserId === userId;
  const isLowerLevel = memberPermissionLevel < permissionLevel;
  const isInLobby = memberCurrentChannelId === currentServerLobbyId;

  const { buildMemberManagementCtxMenu } = useMemberManagementCtxMenu(props);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, memberUserId))
        .addViewProfileOption(() => openUserInfo(userId, memberUserId))
        .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => openKickMemberFromChannel(memberUserId, currentServerId, currentChannelId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(memberUserId, currentServerId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(memberUserId, currentServerId))
        .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => openInviteMember(memberUserId, currentServerId))
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => {}, buildMemberManagementCtxMenu())
        .build(),
    [userId, currentServerId, currentChannelId, memberUserId, memberPermissionLevel, permissionLevel, isSelf, isLowerLevel, isInLobby, buildMemberManagementCtxMenu],
  );

  return { buildContextMenu };
};
