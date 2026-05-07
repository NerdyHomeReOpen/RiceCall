import { useCallback } from 'react';

import type * as Types from '@/types';

import { openUserInfo, unblockUserFromServer } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerSettingBlockedMemberContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId'>;
  member: Pick<Types.Member, 'userId' | 'name'>;
  permissionLevel: Types.Permission;
}

export const useServerSettingBlockedMemberContextMenu = ({ user, server, member, permissionLevel }: UseServerSettingBlockedMemberContextMenuProps) => {
  const isSelf = member.userId === user.userId;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(user.userId, member.userId))
        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => unblockUserFromServer(member.userId, server.serverId, member.name))
        .build(),
    [user.userId, server.serverId, member, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
