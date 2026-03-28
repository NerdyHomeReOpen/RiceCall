import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';
import * as Permission from '@/utils/permission';

import ContextMenu from '@/contextMenu';

interface UseChannelSettingModeratorContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId'>;
  channel: Pick<Types.Channel, 'channelId' | 'categoryId'>;
  moderator: Pick<Types.Member, 'userId' | 'name' | 'permissionLevel'>;
  permissionLevel: Types.Permission;
}

export const useChannelSettingModeratorContextMenu = ({ user, server, channel, moderator, permissionLevel }: UseChannelSettingModeratorContextMenuProps) => {
  const isSelf = moderator.userId === user.userId;
  const isLowerLevel = moderator.permissionLevel < permissionLevel;

  const buildContextMenu = useCallback(
    () => {
      const submenuItems = new ContextMenu()
        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
          Action.terminateMember(moderator.userId, server.serverId, moderator.name),
        )
        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          Permission.isChannelMod(moderator.permissionLevel)
            ? Action.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 2 })
            : Action.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 3 }),
        )
        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          Permission.isChannelAdmin(moderator.permissionLevel)
            ? Action.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
            : Action.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
          Permission.isServerAdmin(moderator.permissionLevel)
            ? Action.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 2 })
            : Action.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 5 }),
        )
        .build();

      return new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, moderator.userId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, moderator.userId))
        .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openEditNickname(moderator.userId, server.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(moderator.userId, server.serverId))
        .addSeparator()
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () => {}, submenuItems)
        .build();
    },
    [user.userId, server.serverId, channel, moderator, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
