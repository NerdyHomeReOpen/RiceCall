import { useCallback } from 'react';

import type * as Types from '@/types';
import { Permission } from '@/types';

import ContextMenu from '@/utils/contextMenu';

import { terminateMember, editChannelPermission, editServerPermission } from '@/services';

interface UseMemberManagementCtxMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel'>;
  channel: Pick<Types.Channel | Types.Category, 'channelId' | 'categoryId' | 'permissionLevel'>;
  member: Pick<Types.OnlineMember | Types.ChannelMessage, 'userId' | 'permissionLevel' | 'name'>;
}

export const useMemberManagementCtxMenu = ({ user, currentServer, channel, member }: UseMemberManagementCtxMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const isSelf = user.userId === member.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;

  const buildMemberManagementCtxMenu = useCallback(
    () =>
      new ContextMenu()
        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          terminateMember(member.userId, currentServer.serverId, member.name),
        )
        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          member.permissionLevel >= Permission.ChannelMod
            ? editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 2 })
            : editChannelPermission(member.userId, currentServer.serverId, channel.channelId, { permissionLevel: 3 }),
        )
        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
          member.permissionLevel >= Permission.ChannelAdmin
            ? editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
            : editChannelPermission(member.userId, currentServer.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          member.permissionLevel >= Permission.ServerAdmin
            ? editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 2 })
            : editServerPermission(member.userId, currentServer.serverId, { permissionLevel: 5 }),
        )
        .build(),
    [currentServer, channel, member, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildMemberManagementCtxMenu };
};
