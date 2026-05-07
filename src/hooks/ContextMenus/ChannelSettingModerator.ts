import { useCallback } from 'react';

import type * as Types from '@/types';
import { Permission } from '@/types';

import ContextMenu from '@/utils/contextMenu';

import * as Actions from '@/action';

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

  const buildContextMenu = useCallback(() => {
    const submenuItems = new ContextMenu()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
        Actions.terminateMember(moderator.userId, server.serverId, moderator.name),
      )
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
        moderator.permissionLevel >= Permission.ChannelMod
          ? Actions.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 2 })
          : Actions.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
        moderator.permissionLevel >= Permission.ChannelAdmin
          ? Actions.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
          : Actions.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
        moderator.permissionLevel >= Permission.ServerAdmin
          ? Actions.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 2 })
          : Actions.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 5 }),
      )
      .build();

    return new ContextMenu()
      .addDirectMessageOption({ isSelf }, () => Actions.openDirectMessage(user.userId, moderator.userId))
      .addViewProfileOption(() => Actions.openUserInfo(user.userId, moderator.userId))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openEditNickname(moderator.userId, server.serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openBlockMember(moderator.userId, server.serverId))
      .addSeparator()
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () => { }, submenuItems)
      .build();
  }, [user.userId, server.serverId, channel, moderator, permissionLevel, isSelf, isLowerLevel]);

  return { buildContextMenu };
};
