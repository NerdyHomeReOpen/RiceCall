import { useCallback } from 'react';

import * as Types from '@/types';

import { openCreateChannel, kickUsersFromServer, openServerBroadcast, openEditChannelOrder } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelListCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  permissionLevel: Types.Permission;
  movableServerUserIds: string[];
}

export const useChannelListCtxMenu = (props: UseChannelListCtxMenuProps) => {
  const { userId, serverId, channelId, permissionLevel, movableServerUserIds } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCreateChannelOption({ permissionLevel }, () => openCreateChannel(userId, serverId))
        .addSeparator()
        .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => kickUsersFromServer(movableServerUserIds, serverId))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => openServerBroadcast(serverId, channelId))
        .addSeparator()
        .addEditChannelOrderOption({ permissionLevel }, () => openEditChannelOrder(userId, serverId))
        .build(),
    [userId, serverId, channelId, movableServerUserIds, permissionLevel],
  );

  return { buildContextMenu };
};
