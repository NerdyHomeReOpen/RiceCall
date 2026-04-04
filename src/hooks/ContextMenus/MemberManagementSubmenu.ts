import { useCallback } from 'react';

import type * as Types from '@/types';

import ContextMenu from '@/contextMenu';

import * as Actions from '@/action';

import { isChannelMod, isChannelAdmin, isServerAdmin } from '@/utils/permission';

interface UseMemberManagementSubmenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel'>;
  channel: Pick<Types.Channel | Types.Category, 'channelId' | 'categoryId' | 'permissionLevel'>;
  member: Pick<Types.OnlineMember | Types.ChannelMessage, 'userId' | 'permissionLevel' | 'name'>;
}

export const useMemberManagementSubmenu = ({ user, currentServer, channel, member }: UseMemberManagementSubmenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const isSelf = user.userId === member.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;

  const buildMemberManagementSubmenu = useCallback(
    () =>
      new ContextMenu()
        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          Actions.terminateMember(member.userId, currentServer.serverId, member.name),
        )
        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          isChannelMod(member.permissionLevel)
            ? Actions.editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 2 })
            : Actions.editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 3 }),
        )
        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          isChannelAdmin(member.permissionLevel)
            ? Actions.editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
            : Actions.editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          isServerAdmin(member.permissionLevel)
            ? Actions.editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 2 })
            : Actions.editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 5 }),
        )
        .build(),
    [currentServer, channel, member, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildMemberManagementSubmenu };
};
