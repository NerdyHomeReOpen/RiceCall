import { useCallback } from 'react';

import type * as Types from '@/types';

import { editChannel, controlQueue } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseVoiceModeCtxMenuProps {
  currentServer: Pick<Types.Server, 'serverId'>;
  currentChannel: Pick<Types.Channel, 'channelId' | 'voiceMode' | 'forbidQueue'>;
  permissionLevel: Types.Permission;
  isQueueControlled: boolean;
}

export const useVoiceModeCtxMenu = ({ currentServer, currentChannel, permissionLevel, isQueueControlled }: UseVoiceModeCtxMenuProps) => {
  const isCurrentChannelFreeMode = currentChannel.voiceMode === 'free';
  const isCurrentChannelAdminMode = currentChannel.voiceMode === 'admin';
  const isCurrentChannelQueueMode = currentChannel.voiceMode === 'queue';

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addFreeSpeechOption({ permissionLevel, isFreeMode: isCurrentChannelFreeMode }, () => editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'free' }))
        .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () => editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'admin' }))
        .addQueueSpeechOption(
          { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
          () => editChannel(currentServer.serverId, currentChannel.channelId, { voiceMode: 'queue' }),
          new ContextMenu()
            .addForbidQueueOption({ permissionLevel, isForbidQueue: currentChannel.forbidQueue }, () =>
              editChannel(currentServer.serverId, currentChannel.channelId, { forbidQueue: !currentChannel.forbidQueue }),
            )
            .addControlQueueOption({ permissionLevel, isQueueControlled }, () => controlQueue(currentServer.serverId, currentChannel.channelId))
            .build(),
        )
        .build(),
    [permissionLevel, isCurrentChannelFreeMode, isCurrentChannelAdminMode, isCurrentChannelQueueMode, currentServer.serverId, currentChannel.channelId, currentChannel.forbidQueue, isQueueControlled],
  );

  return { buildContextMenu };
};
