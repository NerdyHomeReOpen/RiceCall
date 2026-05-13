import { useCallback } from 'react';

import type * as Types from '@/types';

import { openDirectMessage, openUserInfo, openApplyFriend, openEditFriendNote, editFriend, unblockUser, blockUser, deleteFriend, deleteFriendApplication } from '@/services';

import ContextMenu from '@/utils/contextMenu';

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
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(user.userId, friend.targetId))
        .addViewProfileOption(() => openUserInfo(user.userId, friend.targetId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(user.userId, friend.targetId))
        .addEditNoteOption({ isSelf, isFriend }, () => openEditFriendNote(user.userId, friend.targetId))
        .addSeparator()
        .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => { }, onNotifyFriendOnlineClick: () => { } }, () => { })
        .addEditFriendFriendGroupOption(
          { isSelf, isStranger, isBlocked: friend.isBlocked },
          () => { },
          new ContextMenu()
            .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) =>
              editFriend(friend.targetId, { friendGroupId }),
            )
            .build(),
        )
        .addBlockUserOption({ isSelf, isBlocked: friend.isBlocked }, () => (friend.isBlocked ? unblockUser(friend.targetId, friend.name) : blockUser(friend.targetId, friend.name)))
        .addDeleteFriendOption({ isSelf, isFriend }, () => deleteFriend(friend.targetId, friend.name))
        .addDeleteFriendApplicationOption({ isSelf, isPending }, () => deleteFriendApplication(friend.targetId))
        .build(),
    [user, friend, isSelf, isFriend, isStranger, isPending, friendGroups, defaultFriendGroup],
  );

  return { buildContextMenu };
};
