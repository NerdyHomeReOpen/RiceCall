import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

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
          Actions.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'free' }),
        )
        .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () =>
          Actions.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'admin' }),
        )
        .addQueueSpeechOption(
          { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
          () => Actions.editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'queue' }),
          new ContextMenu()
            .addForbidQueueOption({ permissionLevel, isForbidQueue: currentChannel.forbidQueue }, () =>
              Actions.editChannel(currentServer.serverId, currentChannel.channelId, { forbidQueue: !currentChannel.forbidQueue }),
            )
            .addControlQueueOption({ permissionLevel, isQueueControlled }, () => Actions.controlQueue(currentServer.serverId, currentChannel.channelId))
            .build(),
        )
        .build(),
    [permissionLevel, isCurrentChannelFreeMode, isCurrentChannelAdminMode, isCurrentChannelQueueMode, currentServer.serverId, currentChannel.channelId, currentChannel.forbidQueue, isQueueControlled],
  );

  return { buildContextMenu };
};
