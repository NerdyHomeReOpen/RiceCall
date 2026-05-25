import { useCallback } from 'react';

import * as Types from '@/types';

import { openUserInfo, unblockUserFromServer } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerSettingBlockedMemberCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  memberUserId: Types.Member['userId'];
  memberName: Types.Member['name'];
  permissionLevel: Types.Permission;
  isSelf: boolean;
}

export const useServerSettingBlockedMemberCtxMenu = ({ userId, serverId, memberUserId, memberName, permissionLevel, isSelf }: UseServerSettingBlockedMemberCtxMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(userId, memberUserId))
        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => unblockUserFromServer(memberUserId, serverId, memberName))
        .build(),
    [userId, serverId, memberUserId, memberName, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
