import { useCallback } from 'react';

import * as Types from '@/types';

import ContextMenu from '@/utils/contextMenu';

import { openDirectMessage, openUserInfo, openEditNickname, openBlockMember, terminateMember, editChannelPermission, editServerPermission } from '@/services';

interface UseChannelSettingModeratorCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  channelCategoryId: Types.Channel['categoryId'];
  moderatorUserId: Types.Member['userId'];
  moderatorName: Types.Member['name'];
  moderatorPermissionLevel: Types.Member['permissionLevel'];
  permissionLevel: Types.Permission;
  isSelf: boolean;
  isLowerLevel: boolean;
}

export const useChannelSettingModeratorCtxMenu = (props: UseChannelSettingModeratorCtxMenuProps) => {
  const { userId, serverId, channelId, channelCategoryId, moderatorUserId, moderatorName, moderatorPermissionLevel, permissionLevel, isSelf, isLowerLevel } = props;

  const buildContextMenu = useCallback(() => {
    const submenuItems = new ContextMenu()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isLowerLevel }, () => terminateMember(moderatorUserId, serverId, moderatorName))
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isLowerLevel, channelCategoryId }, () =>
        moderatorPermissionLevel >= Types.Permission.ChannelMod
          ? editChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 2 })
          : editChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isLowerLevel, channelCategoryId }, () =>
        moderatorPermissionLevel >= Types.Permission.ChannelAdmin
          ? editChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
          : editChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isLowerLevel }, () =>
        moderatorPermissionLevel >= Types.Permission.ServerAdmin
          ? editServerPermission(moderatorUserId, serverId, { permissionLevel: 2 })
          : editServerPermission(moderatorUserId, serverId, { permissionLevel: 5 }),
      )
      .build();

    return new ContextMenu()
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, moderatorUserId))
      .addViewProfileOption(() => openUserInfo(userId, moderatorUserId))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(moderatorUserId, serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(moderatorUserId, serverId))
      .addSeparator()
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isLowerLevel }, () => {}, submenuItems)
      .build();
  }, [userId, serverId, channelId, channelCategoryId, moderatorUserId, moderatorName, moderatorPermissionLevel, permissionLevel, isSelf, isLowerLevel]);

  return { buildContextMenu };
};
