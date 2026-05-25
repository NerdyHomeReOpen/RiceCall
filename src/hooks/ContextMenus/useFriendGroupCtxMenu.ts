import { useCallback } from 'react';

import * as Types from '@/types';

import { openEditFriendGroupName, deleteFriendGroup } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseFriendGroupCtxMenuProps {
  userId: Types.User['userId'];
  friendGroupId: Types.FriendGroup['friendGroupId'];
  friendGroupName: Types.FriendGroup['name'];
}

export const useFriendGroupCtxMenu = (props: UseFriendGroupCtxMenuProps) => {
  const { userId, friendGroupId, friendGroupName } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addEditFriendGroupNameOption({ friendGroupId }, () => openEditFriendGroupName(userId, friendGroupId))
        .addDeleteFriendGroupOption({ friendGroupId }, () => deleteFriendGroup(friendGroupId, friendGroupName))
        .build(),
    [userId, friendGroupId, friendGroupName],
  );

  return { buildContextMenu };
};
