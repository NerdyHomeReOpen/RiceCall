import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import ContextMenu from '@/contextMenu';

interface UseChannelListContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel'>;
  movableServerUserIds: string[];
}

export const useChannelListContextMenu = ({ user, currentServer, currentChannel, movableServerUserIds }: UseChannelListContextMenuProps) => {
  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCreateChannelOption({ permissionLevel }, () => Action.openCreateChannel(user.userId, currentServer.serverId, ''))
        .addSeparator()
        .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => Action.kickUsersFromServer(movableServerUserIds, currentServer.serverId))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => Action.openServerBroadcast(currentServer.serverId, currentChannel.channelId))
        .addSeparator()
        .addEditChannelOrderOption({ permissionLevel }, () => Action.openEditChannelOrder(user.userId, currentServer.serverId))
        .build(),
    [user, currentServer, currentChannel, movableServerUserIds, permissionLevel],
  );

  return { buildContextMenu };
};
