import { useCallback } from 'react';

import type * as Types from '@/types';

import { openEditFriendGroupName, deleteFriendGroup } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseFriendGroupContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  friendGroup: Pick<Types.FriendGroup, 'friendGroupId' | 'name'>;
}

export const useFriendGroupContextMenu = ({ user, friendGroup }: UseFriendGroupContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addEditFriendGroupNameOption({ friendGroupId: friendGroup.friendGroupId }, () => openEditFriendGroupName(user.userId, friendGroup.friendGroupId))
        .addDeleteFriendGroupOption({ friendGroupId: friendGroup.friendGroupId }, () => deleteFriendGroup(friendGroup.friendGroupId, friendGroup.name))
        .build(),
    [user, friendGroup],
  );

  return { buildContextMenu };
};
