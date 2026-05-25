import { useCallback } from 'react';

import * as Types from '@/types';

import { editChannel, controlQueue } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseVoiceModeCtxMenuProps {
  currentServerId: Types.Server['serverId'];
  currentChannelId: Types.Channel['channelId'];
  currentChannelVoiceMode: Types.Channel['voiceMode'];
  currentChannelForbidQueue: Types.Channel['forbidQueue'];
  permissionLevel: Types.Permission;
  isQueueControlled: boolean;
}

export const useVoiceModeCtxMenu = (props: UseVoiceModeCtxMenuProps) => {
  const { currentServerId, currentChannelId, currentChannelVoiceMode, currentChannelForbidQueue, permissionLevel, isQueueControlled } = props;
  const isCurrentChannelFreeMode = currentChannelVoiceMode === 'free';
  const isCurrentChannelAdminMode = currentChannelVoiceMode === 'admin';
  const isCurrentChannelQueueMode = currentChannelVoiceMode === 'queue';

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addFreeSpeechOption({ permissionLevel, isFreeMode: isCurrentChannelFreeMode }, () => editChannel(currentServerId, currentChannelId, { voiceMode: 'free' }))
        .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () => editChannel(currentServerId, currentChannelId, { voiceMode: 'admin' }))
        .addQueueSpeechOption(
          { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
          () => editChannel(currentServerId, currentChannelId, { voiceMode: 'queue' }),
          new ContextMenu()
            .addForbidQueueOption({ permissionLevel, isForbidQueue: currentChannelForbidQueue }, () => editChannel(currentServerId, currentChannelId, { forbidQueue: !currentChannelForbidQueue }))
            .addControlQueueOption({ permissionLevel, isQueueControlled }, () => controlQueue(currentServerId, currentChannelId))
            .build(),
        )
        .build(),
    [permissionLevel, isCurrentChannelFreeMode, isCurrentChannelAdminMode, isCurrentChannelQueueMode, currentServerId, currentChannelId, currentChannelForbidQueue, isQueueControlled],
  );

  return { buildContextMenu };
};
