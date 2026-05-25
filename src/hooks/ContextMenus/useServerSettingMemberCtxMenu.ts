import { useCallback } from 'react';

import * as Types from '@/types';

import ContextMenu from '@/utils/contextMenu';

import { openDirectMessage, openUserInfo, openEditNickname, openBlockMember, terminateMember, editServerPermission } from '@/services';

interface UseServerSettingMemberCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  memberUserId: Types.Member['userId'];
  memberName: Types.Member['name'];
  memberPermissionLevel: Types.Member['permissionLevel'];
  permissionLevel: Types.Permission;
  isSelf: boolean;
  isLowerLevel: boolean;
}

export const useServerSettingMemberCtxMenu = ({ userId, serverId, memberUserId, memberName, memberPermissionLevel, permissionLevel, isSelf, isLowerLevel }: UseServerSettingMemberCtxMenuProps) => {
  const buildContextMenu = useCallback(() => {
    const submenuItems = new ContextMenu()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => terminateMember(memberUserId, serverId, memberName))
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () =>
        memberPermissionLevel >= Types.Permission.ServerAdmin
          ? editServerPermission(memberUserId, serverId, { permissionLevel: 2 })
          : editServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
      )
      .build();

    return new ContextMenu()
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, memberUserId))
      .addViewProfileOption(() => openUserInfo(userId, memberUserId))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(memberUserId, serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(memberUserId, serverId))
      .addSeparator()
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => {}, submenuItems)
      .build();
  }, [userId, serverId, memberUserId, memberName, memberPermissionLevel, permissionLevel, isSelf, isLowerLevel]);

  return { buildContextMenu };
};
