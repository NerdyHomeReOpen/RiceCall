import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UseFriendTabContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  friend: Pick<Types.Friend, 'targetId' | 'name' | 'relationStatus' | 'isBlocked' | 'friendGroupId'>;
  friendGroups: Types.FriendGroup[];
  defaultFriendGroup: Types.FriendGroup;
}

export const useFriendTabContextMenu = ({ user, friend, friendGroups, defaultFriendGroup }: UseFriendTabContextMenuProps) => {
  const isSelf = friend.targetId === user.userId;
  const isFriend = friend.relationStatus === 2;
  const isStranger = friend.relationStatus === 0;
  const isPending = friend.relationStatus === 1;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => Actions.openDirectMessage(user.userId, friend.targetId))
        .addViewProfileOption(() => Actions.openUserInfo(user.userId, friend.targetId))
        .addAddFriendOption({ isSelf, isFriend }, () => Actions.openApplyFriend(user.userId, friend.targetId))
        .addEditNoteOption({ isSelf, isFriend }, () => Actions.openEditFriendNote(user.userId, friend.targetId))
        .addSeparator()
        .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => { }, onNotifyFriendOnlineClick: () => { } }, () => { })
        .addEditFriendFriendGroupOption(
          { isSelf, isStranger, isBlocked: friend.isBlocked },
          () => { },
          new ContextMenu()
            .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) =>
              Actions.editFriend(friend.targetId, { friendGroupId }),
            )
            .build(),
        )
        .addBlockUserOption({ isSelf, isBlocked: friend.isBlocked }, () => (friend.isBlocked ? Actions.unblockUser(friend.targetId, friend.name) : Actions.blockUser(friend.targetId, friend.name)))
        .addDeleteFriendOption({ isSelf, isFriend }, () => Actions.deleteFriend(friend.targetId, friend.name))
        .addDeleteFriendApplicationOption({ isSelf, isPending }, () => Actions.deleteFriendApplication(friend.targetId))
        .build(),
    [user, friend, isSelf, isFriend, isStranger, isPending, friendGroups, defaultFriendGroup],
  );

  return { buildContextMenu };
};
