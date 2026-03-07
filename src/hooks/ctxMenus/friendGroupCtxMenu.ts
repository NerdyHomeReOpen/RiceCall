import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UseFriendGroupContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  friendGroup: Pick<Types.FriendGroup, 'friendGroupId' | 'name'>;
}

export const useFriendGroupContextMenu = ({ user, friendGroup }: UseFriendGroupContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addEditFriendGroupNameOption({ friendGroupId: friendGroup.friendGroupId }, () => Action.openEditFriendGroupName(user.userId, friendGroup.friendGroupId))
        .addDeleteFriendGroupOption({ friendGroupId: friendGroup.friendGroupId }, () => Action.deleteFriendGroup(friendGroup.friendGroupId, friendGroup.name))
        .build(),
    [user, friendGroup],
  );

  return { buildContextMenu };
};
