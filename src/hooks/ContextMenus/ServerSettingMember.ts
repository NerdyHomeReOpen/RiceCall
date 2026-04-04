import { useCallback } from 'react';

import type * as Types from '@/types';

import ContextMenu from '@/contextMenu';

import * as Actions from '@/action';

import { isServerAdmin } from '@/utils/permission';

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
          Actions.terminateMember(member.userId, server.serverId, member.name),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
          isServerAdmin(member.permissionLevel)
            ? Actions.editServerPermission(member.userId, server.serverId, { permissionLevel: 2 })
            : Actions.editServerPermission(member.userId, server.serverId, { permissionLevel: 5 }),
        )
        .build();

      return new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => Actions.openDirectMessage(user.userId, member.userId))
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, member.userId))
        .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openEditNickname(member.userId, server.serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Actions.openBlockMember(member.userId, server.serverId))
        .addSeparator()
        .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => { }, submenuItems)
        .build();
    },
    [user.userId, server.serverId, member, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
