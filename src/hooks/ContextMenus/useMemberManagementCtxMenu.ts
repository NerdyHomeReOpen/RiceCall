import { useCallback } from 'react';

import * as Types from '@/types';

import ContextMenu from '@/utils/contextMenu';

import { terminateMember, editChannelPermission, editServerPermission } from '@/services';

interface UseMemberManagementCtxMenuProps {
  userId: Types.User['userId'];
  userPermissionLevel: Types.User['permissionLevel'];
  currentServerId: Types.Server['serverId'];
  currentServerPermissionLevel: Types.Server['permissionLevel'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelPermissionLevel: Types.Channel['permissionLevel'];
  currentChannelCategoryId: Types.Channel['categoryId'];
  memberUserId: Types.Member['userId'];
  memberPermissionLevel: Types.Member['permissionLevel'];
  memberName: Types.Member['name'];
}

export const useMemberManagementCtxMenu = (props: UseMemberManagementCtxMenuProps) => {
  const {
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentChannelId,
    currentChannelPermissionLevel,
    currentChannelCategoryId,
    memberUserId,
    memberPermissionLevel,
    memberName,
  } = props;

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = memberUserId === userId;
  const isLowerLevel = memberPermissionLevel < permissionLevel;

  const buildMemberManagementCtxMenu = useCallback(
    () =>
      new ContextMenu()
        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () => terminateMember(memberUserId, currentServerId, memberName))
        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
          memberPermissionLevel >= Types.Permission.ChannelMod
            ? editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
            : editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
        )
        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannelCategoryId }, () =>
          memberPermissionLevel >= Types.Permission.ChannelAdmin
            ? editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
            : editChannelPermission(memberUserId, currentServerId, currentChannelId, { permissionLevel: 4 }),
        )
        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isLowerLevel }, () =>
          memberPermissionLevel >= Types.Permission.ServerAdmin
            ? editServerPermission(memberUserId, currentServerId, { permissionLevel: 2 })
            : editServerPermission(memberUserId, currentServerId, { permissionLevel: 5 }),
        )
        .build(),
    [currentServerId, currentChannelId, currentChannelCategoryId, memberUserId, memberPermissionLevel, memberName, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildMemberManagementCtxMenu };
};
