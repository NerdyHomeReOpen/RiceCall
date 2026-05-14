import { useCallback } from 'react';

import type * as Types from '@/types';

import { openUserInfo, openKickMemberFromServer, openBlockMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelEventCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  currentServer: Pick<Types.Server, 'serverId'>;
  event: Pick<Types.ChannelEvent, 'userId' | 'permissionLevel'>;
  permissionLevel: Types.Permission;
}

export const useChannelEventCtxMenu = ({ user, currentServer, event, permissionLevel }: UseChannelEventCtxMenuProps) => {
  const isSelf = event.userId === user.userId;
  const isLowerLevel = event.permissionLevel < permissionLevel;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(user.userId, event.userId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(event.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(event.userId, currentServer.serverId))
        .build(),
    [user.userId, currentServer.serverId, event, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
