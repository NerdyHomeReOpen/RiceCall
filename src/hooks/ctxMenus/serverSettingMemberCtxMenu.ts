import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';
import * as Permission from '@/utils/permission';

import ContextMenu from '@/contextMenu';

interface UseServerSettingMemberContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId'>;
  member: Pick<Types.Member, 'userId' | 'name' | 'permissionLevel'>;
  permissionLevel: Types.Permission;
}

export const useServerSettingMemberContextMenu = ({ user, server, member, permissionLevel }: UseServerSettingMemberContextMenuProps) => {
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;

  const buildContextMenu = useCallback(
    () => {
      const submenuItems = new ContextMenu()
        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          Action.terminateMember(member.userId, server.serverId, member.name),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          Permission.isServerAdmin(member.permissionLevel)
            ? Action.editServerPermission(member.userId, server.serverId, { permissionLevel: 2 })
            : Action.editServerPermission(member.userId, server.serverId, { permissionLevel: 5 }),
        )
        .build();

      return new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, member.userId))
        .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openEditNickname(member.userId, server.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Action.openBlockMember(member.userId, server.serverId))
        .addSeparator()
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => {}, submenuItems)
        .build();
    },
    [user.userId, server.serverId, member, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
