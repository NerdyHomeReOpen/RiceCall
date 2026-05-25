import { useCallback } from 'react';

import * as Types from '@/types';

import { openUserInfo, unblockUserFromChannel } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseChannelSettingBlockedMemberCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  memberUserId: Types.Member['userId'];
  memberName: Types.Member['name'];
  permissionLevel: Types.Permission;
  isSelf: boolean;
}

export const useChannelSettingBlockedMemberCtxMenu = (props: UseChannelSettingBlockedMemberCtxMenuProps) => {
  const { userId, serverId, channelId, memberUserId, memberName, permissionLevel, isSelf } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(userId, memberUserId))
        .addUnblockUserFromChannelOption({ permissionLevel, isSelf }, () => unblockUserFromChannel(memberUserId, serverId, channelId, memberName))
        .build(),
    [userId, serverId, channelId, memberUserId, memberName, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
