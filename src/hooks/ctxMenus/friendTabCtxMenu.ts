import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UseFriendTabContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  friend: Pick<Types.Friend, 'targetId' | 'name' | 'relationStatus' | 'isBlocked' | 'friendGroupId'>;
  friendGroups: Types.FriendGroup[];
  defaultFriendGroup: Types.FriendGroup;
}

export const useFriendTabContextMenu = ({ user, friend, friendGroups, defaultFriendGroup }: UseFriendTabContextMenuProps) => {
  // Variables
  const isSelf = friend.targetId === user.userId;
  const isFriend = friend.relationStatus === 2;
  const isStranger = friend.relationStatus === 0;
  const isPending = friend.relationStatus === 1;

  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addDirectMessageOption({ isSelf }, () => Action.openDirectMessage(user.userId, friend.targetId))
        .addViewProfileOption(() => Action.openUserInfo(user.userId, friend.targetId))
        .addAddFriendOption({ isSelf, isFriend }, () => Action.openApplyFriend(user.userId, friend.targetId))
        .addEditNoteOption({ isSelf, isFriend }, () => Action.openEditFriendNote(user.userId, friend.targetId))
        .addSeparator()
        .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {})
        .addEditFriendFriendGroupOption(
          { isSelf, isStranger, isBlocked: friend.isBlocked },
          () => {},
          new CtxMenuBuilder()
            .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) =>
              Action.editFriend(friend.targetId, { friendGroupId }),
            )
            .build(),
        )
        .addBlockUserOption({ isSelf, isBlocked: friend.isBlocked }, () => (friend.isBlocked ? Action.unblockUser(friend.targetId, friend.name) : Action.blockUser(friend.targetId, friend.name)))
        .addDeleteFriendOption({ isSelf, isFriend }, () => Action.deleteFriend(friend.targetId, friend.name))
        .addDeleteFriendApplicationOption({ isSelf, isPending }, () => Action.deleteFriendApplication(friend.targetId))
        .build(),
    [user, friend, isSelf, isFriend, isStranger, isPending, friendGroups, defaultFriendGroup],
  );

  return { buildContextMenu };
};
