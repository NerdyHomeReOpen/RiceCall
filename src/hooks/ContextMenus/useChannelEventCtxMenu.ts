import { useCallback } from 'react';

import * as Types from '@/types';

import { openUserInfo, openKickMemberFromServer, openBlockMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelEventCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  eventUserId: Types.ChannelEvent['userId'];
  permissionLevel: Types.Permission;
  isSelf: boolean;
  isLowerLevel: boolean;
}

export const useChannelEventCtxMenu = (props: UseChannelEventCtxMenuProps) => {
  const { userId, serverId, eventUserId, permissionLevel, isSelf, isLowerLevel } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(userId, eventUserId))
        .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(eventUserId, serverId))
        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(eventUserId, serverId))
        .build(),
    [userId, serverId, eventUserId, permissionLevel, isSelf, isLowerLevel],
  );

  return { buildContextMenu };
};
