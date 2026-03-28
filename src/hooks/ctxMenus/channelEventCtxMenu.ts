import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import ContextMenu from '@/contextMenu';

interface UseChannelEventContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  currentServer: Pick<Types.Server, 'serverId'>;
  event: Pick<Types.ChannelEvent, 'userId' | 'permissionLevel'>;
  permissionLevel: Types.Permission;
}

export const useChannelEventContextMenu = ({ user, currentServer, event, permissionLevel }: UseChannelEventContextMenuProps) => {
  const isSelf = event.userId === user.userId;
  const isLowerLevel = event.permissionLevel < permissionLevel;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => Action.openUserInfo(user.userId, event.userId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openKickMemberFromServer(event.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(event.userId, currentServer.serverId))
        .build(),
    [user.userId, currentServer.serverId, event, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
