import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/utils/contextMenu';

interface UseFriendGroupContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  friendGroup: Pick<Types.FriendGroup, 'friendGroupId' | 'name'>;
}

export const useFriendGroupContextMenu = ({ user, friendGroup }: UseFriendGroupContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addEditFriendGroupNameOption({ friendGroupId: friendGroup.friendGroupId }, () => Actions.openEditFriendGroupName(user.userId, friendGroup.friendGroupId))
        .addDeleteFriendGroupOption({ friendGroupId: friendGroup.friendGroupId }, () => Actions.deleteFriendGroup(friendGroup.friendGroupId, friendGroup.name))
        .build(),
    [user, friendGroup],
  );

  return { buildContextMenu };
};
