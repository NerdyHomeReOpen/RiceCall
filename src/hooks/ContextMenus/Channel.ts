import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UseChannelContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'lobbyId' | 'receptionLobbyId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'permissionLevel'>;
  channel: Pick<Types.Channel | Types.Category, 'channelId' | 'permissionLevel' | 'categoryId' | 'visibility' | 'name'>;
  category?: Pick<Types.Category, 'channelId' | 'permissionLevel'>;
  movableChannelUserIds: string[];
  movableServerUserIds: string[];
  canJoin: boolean;
  isPasswordNeeded: boolean;
}

export const useChannelContextMenu = ({ channel, user, currentServer, currentChannel, movableChannelUserIds, movableServerUserIds, canJoin, isPasswordNeeded }: UseChannelContextMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isInChannel = currentChannel.channelId === channel.channelId;
  const isReceptionLobby = currentServer.receptionLobbyId === channel.channelId;
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isSubChannel = !!channel.categoryId;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinChannelOption({ canJoin, isInChannel }, () => Actions.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded))
        .addViewOrEditOption(() => Actions.openChannelSetting(user.userId, currentServer.serverId, channel.channelId))
        .addSeparator()
        .addCreateChannelOption({ permissionLevel }, () => Actions.openCreateChannel(user.userId, currentServer.serverId, ''))
        .addCreateSubChannelOption({ permissionLevel }, () => Actions.openCreateChannel(user.userId, currentServer.serverId, channel.categoryId ?? channel.channelId))
        .addDeleteChannelOption({ permissionLevel, isSubChannel }, () => Actions.deleteChannel(currentServer.serverId, channel.channelId, channel.name))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => Actions.openServerBroadcast(currentServer.serverId, channel.channelId))
        .addSeparator()
        .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableChannelUserIds }, () =>
          Actions.moveAllUsersToChannel(movableChannelUserIds, currentServer.serverId, currentChannel.channelId),
        )
        .addEditChannelOrderOption({ permissionLevel }, () => Actions.openEditChannelOrder(user.userId, currentServer.serverId))
        .addSeparator()
        .addKickChannelUsersFromServerOption({ permissionLevel, movableChannelUserIds }, () => Actions.kickUsersFromServer(movableChannelUserIds, currentServer.serverId))
        .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => Actions.kickUsersFromServer(movableServerUserIds, currentServer.serverId))
        .addSeparator()
        .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () =>
          Actions.editServer(currentServer.serverId, { receptionLobbyId: channel.channelId }),
        )
        .build(),
    [
      user,
      currentServer,
      currentChannel,
      channel,
      movableChannelUserIds,
      movableServerUserIds,
      canJoin,
      isPasswordNeeded,
      permissionLevel,
      currentPermissionLevel,
      isInChannel,
      isReceptionLobby,
      isPrivateChannel,
      isReadonlyChannel,
      isSubChannel,
    ],
  );

  return { buildContextMenu };
};
