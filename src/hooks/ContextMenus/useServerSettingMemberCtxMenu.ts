import { useCallback } from 'react';

import type * as Types from '@/types';
import { Permission } from '@/types';

import ContextMenu from '@/utils/contextMenu';

import { openDirectMessage, openUserInfo, openEditNickname, openBlockMember, terminateMember, editServerPermission } from '@/services';

interface UseServerSettingMemberCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId'>;
  member: Pick<Types.Member, 'userId' | 'name' | 'permissionLevel'>;
  permissionLevel: Types.Permission;
}

export const useServerSettingMemberCtxMenu = ({ user, server, member, permissionLevel }: UseServerSettingMemberCtxMenuProps) => {
  const isSelf = member.userId === user.userId;
  const isLowerLevel = member.permissionLevel < permissionLevel;

  const buildContextMenu = useCallback(() => {
    const submenuItems = new ContextMenu()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => terminateMember(member.userId, server.serverId, member.name))
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
        member.permissionLevel >= Permission.ServerAdmin
          ? editServerPermission(member.userId, server.serverId, { permissionLevel: 2 })
          : editServerPermission(member.userId, server.serverId, { permissionLevel: 5 }),
      )
      .build();

    return new ContextMenu()
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(user.userId, member.userId))
      .addViewProfileOption(() => openUserInfo(user.userId, member.userId))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(member.userId, server.serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(member.userId, server.serverId))
      .addSeparator()
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () => { }, submenuItems)
      .build();
  }, [user.userId, server.serverId, member, permissionLevel, isSelf, isLowerLevel]);

  return { buildContextMenu };
};
