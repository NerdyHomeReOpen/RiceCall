import { useCallback } from 'react';

import * as Types from '@/types';

import { connectChannel, openChannelSetting, openCreateChannel, openEditChannelOrder, deleteChannel, openServerBroadcast, moveAllUsersToChannel, kickUsersFromServer, editServer } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelCtxMenuProps {
  userId: Types.User['userId'];
  userPermissionLevel: Types.User['permissionLevel'];
  currentServerId: Types.Server['serverId'];
  currentServerPermissionLevel: Types.Server['permissionLevel'];
  currentServerReceptionLobbyId: Types.Server['receptionLobbyId'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelPermissionLevel: Types.Channel['permissionLevel'];
  channel: Types.Channel | Types.Category;
  movableChannelUserIds: string[];
  movableServerUserIds: string[];
  canJoin: boolean;
  isPasswordNeeded: boolean;
}

export const useChannelCtxMenu = (props: UseChannelCtxMenuProps) => {
  const {
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerReceptionLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    channel,
    movableChannelUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  } = props;
  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isInChannel = currentChannelId === channel.channelId;
  const isReceptionLobby = currentServerReceptionLobbyId === channel.channelId;
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isSubChannel = !!channel.categoryId;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinChannelOption({ canJoin, isInChannel }, () => connectChannel(currentServerId, channel.channelId, canJoin, isPasswordNeeded))
        .addViewOrEditOption(() => openChannelSetting(userId, currentServerId, channel.channelId))
        .addSeparator()
        .addCreateChannelOption({ permissionLevel }, () => openCreateChannel(userId, currentServerId))
        .addCreateSubChannelOption({ permissionLevel }, () => openCreateChannel(userId, currentServerId, channel.categoryId ?? channel.channelId))
        .addDeleteChannelOption({ permissionLevel, isSubChannel }, () => deleteChannel(currentServerId, channel.channelId, channel.name))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => openServerBroadcast(currentServerId, channel.channelId))
        .addSeparator()
        .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableChannelUserIds }, () =>
          moveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId),
        )
        .addEditChannelOrderOption({ permissionLevel }, () => openEditChannelOrder(userId, currentServerId))
        .addSeparator()
        .addKickChannelUsersFromServerOption({ permissionLevel, movableChannelUserIds }, () => kickUsersFromServer(movableChannelUserIds, currentServerId))
        .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => kickUsersFromServer(movableServerUserIds, currentServerId))
        .addSeparator()
        .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => editServer(currentServerId, { receptionLobbyId: channel.channelId }))
        .build(),
    [
      userId,
      currentServerId,
      currentChannelId,
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
