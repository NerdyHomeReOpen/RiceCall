import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

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
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, member.userId))
        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => Actions.unblockUserFromServer(member.userId, server.serverId, member.name))
        .build(),
    [user.userId, server.serverId, member, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
