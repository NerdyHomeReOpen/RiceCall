import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/utils/contextMenu';

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
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, event.userId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openKickMemberFromServer(event.userId, currentServer.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openBlockMember(event.userId, currentServer.serverId))
        .build(),
    [user.userId, currentServer.serverId, event, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
