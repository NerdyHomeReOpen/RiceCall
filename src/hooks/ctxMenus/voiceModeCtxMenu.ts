import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import ContextMenu from '@/contextMenu';

interface UseVoiceModeContextMenuProps {
  currentServer: Pick<Types.Server, 'serverId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'voiceMode' | 'forbidQueue'>;
  permissionLevel: Types.Permission;
  isQueueControlled: boolean;
}

export const useVoiceModeContextMenu = ({ currentServer, currentChannel, permissionLevel, isQueueControlled }: UseVoiceModeContextMenuProps) => {
  const isCurrentChannelFreeMode = currentChannel.voiceMode === 'free';
  const isCurrentChannelAdminMode = currentChannel.voiceMode === 'admin';
  const isCurrentChannelQueueMode = currentChannel.voiceMode === 'queue';

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addFreeSpeechOption({ permissionLevel, isFreeMode: isCurrentChannelFreeMode }, () =>
          Action.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'free' }),
        )
        .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () =>
          Action.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'admin' }),
        )
        .addQueueSpeechOption(
          { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
          () => Action.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'queue' }),
          new ContextMenu()
            .addForbidQueueOption({ permissionLevel, isForbidQueue: currentChannel.forbidQueue }, () =>
              Action.editChannel(currentServer.serverId, currentChannel.channelId, { forbidQueue: !currentChannel.forbidQueue }),
            )
            .addControlQueueOption({ permissionLevel, isQueueControlled }, () => Action.controlQueue(currentServer.serverId, currentChannel.channelId))
            .build(),
        )
        .build(),
    [permissionLevel, isCurrentChannelFreeMode, isCurrentChannelAdminMode, isCurrentChannelQueueMode, currentServer.serverId, currentChannel.channelId, currentChannel.forbidQueue, isQueueControlled],
  );

  return { buildContextMenu };
};
