import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import ContextMenu from '@/contextMenu';

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
        .addViewProfileOption(() => Action.openUserInfo(user.userId, member.userId))
        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => Action.unblockUserFromServer(member.userId, server.serverId, member.name))
        .build(),
    [user.userId, server.serverId, member, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
