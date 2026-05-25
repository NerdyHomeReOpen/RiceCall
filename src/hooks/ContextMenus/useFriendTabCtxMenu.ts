import { useCallback } from 'react';

import * as Types from '@/types';

import { openDirectMessage, openUserInfo, openApplyFriend, openEditFriendNote, editFriend, unblockUser, blockUser, deleteFriend, deleteFriendApplication } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseFriendTabCtxMenuProps {
  userId: Types.User['userId'];
  friendTargetId: Types.Friend['targetId'];
  friendName: Types.Friend['name'];
  friendRelationStatus: Types.Friend['relationStatus'];
  friendIsBlocked: Types.Friend['isBlocked'];
  friendFriendGroupId: Types.Friend['friendGroupId'];
  friendGroups: Types.FriendGroup[];
  defaultFriendGroup: Types.FriendGroup;
}

export const useFriendTabCtxMenu = (props: UseFriendTabCtxMenuProps) => {
  const { userId, friendTargetId, friendName, friendRelationStatus, friendIsBlocked, friendFriendGroupId, friendGroups, defaultFriendGroup } = props;
  const isSelf = friendTargetId === userId;
  const isFriend = friendRelationStatus === 2;
  const isStranger = friendRelationStatus === 0;
  const isPending = friendRelationStatus === 1;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, friendTargetId))
        .addViewProfileOption(() => openUserInfo(userId, friendTargetId))
        .addAddFriendOption({ isSelf, isFriend }, () => openApplyFriend(userId, friendTargetId))
        .addEditNoteOption({ isSelf, isFriend }, () => openEditFriendNote(userId, friendTargetId))
        .addSeparator()
        .addPermissionSettingOption({ isSelf, isFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {})
        .addEditFriendFriendGroupOption(
          { isSelf, isStranger, isBlocked: friendIsBlocked },
          () => {},
          new ContextMenu()
            .addFriendGroupOption({ friendGroupId: friendFriendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) => editFriend(friendTargetId, { friendGroupId }))
            .build(),
        )
        .addBlockUserOption({ isSelf, isBlocked: friendIsBlocked }, () => (friendIsBlocked ? unblockUser(friendTargetId, friendName) : blockUser(friendTargetId, friendName)))
        .addDeleteFriendOption({ isSelf, isFriend }, () => deleteFriend(friendTargetId, friendName))
        .addDeleteFriendApplicationOption({ isSelf, isPending }, () => deleteFriendApplication(friendTargetId))
        .build(),
    [userId, friendTargetId, friendName, friendIsBlocked, friendFriendGroupId, friendGroups, defaultFriendGroup, isSelf, isFriend, isStranger, isPending],
  );

  return { buildContextMenu };
};
