import { useCallback } from 'react';

import type * as Types from '@/types';

import { openCreateChannel, kickUsersFromServer, openServerBroadcast, openEditChannelOrder } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelListContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel'>;
  movableServerUserIds: string[];
}

export const useChannelListContextMenu = ({ user, currentServer, currentChannel, movableServerUserIds }: UseChannelListContextMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCreateChannelOption({ permissionLevel }, () => openCreateChannel(user.userId, currentServer.serverId))
        .addSeparator()
        .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => kickUsersFromServer(movableServerUserIds, currentServer.serverId))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => openServerBroadcast(currentServer.serverId, currentChannel.channelId))
        .addSeparator()
        .addEditChannelOrderOption({ permissionLevel }, () => openEditChannelOrder(user.userId, currentServer.serverId))
        .build(),
    [user, currentServer, currentChannel, movableServerUserIds, permissionLevel],
  );

  return { buildContextMenu };
};
