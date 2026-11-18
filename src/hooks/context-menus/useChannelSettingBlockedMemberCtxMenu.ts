import { useCallback } from 'react';

import type * as Types from '@/types';

import { openUserInfo, unblockUserFromChannel } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UseChannelSettingBlockedMemberCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId'>;
  channel: Pick<Types.Channel, 'channelId'>;
  member: Pick<Types.Member, 'userId' | 'name'>;
  permissionLevel: Types.Permission;
}

export const useChannelSettingBlockedMemberCtxMenu = ({ user, server, channel, member, permissionLevel }: UseChannelSettingBlockedMemberCtxMenuProps) => {
  const isSelf = member.userId === user.userId;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addViewProfileOption(() => openUserInfo(member.userId))
        .addUnblockUserFromChannelOption({ permissionLevel, isSelf }, () => unblockUserFromChannel(member.userId, server.serverId, channel.channelId, member.name))
        .build(),
    [server.serverId, channel.channelId, member, permissionLevel, isSelf],
  );

  return { buildContextMenu };
};
