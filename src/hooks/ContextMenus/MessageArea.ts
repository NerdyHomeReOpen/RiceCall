import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UseMessageAreaContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  currentServer: Pick<Types.Server, 'serverId'>;
  channelEvents: Types.ChannelEvent[];
  onOpenAnnouncement: () => void;
  onClearMessages: () => void;
}

export const useMessageAreaContextMenu = ({ user, currentServer, channelEvents, onOpenAnnouncement, onClearMessages }: UseMessageAreaContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCleanUpMessageOption(onClearMessages)
        .addOpenChannelEventOption(() => Actions.openChannelEvent(user.userId, currentServer.serverId, channelEvents))
        .addOpenAnnouncementOption(onOpenAnnouncement)
        .build(),
    [onClearMessages, onOpenAnnouncement, user.userId, currentServer.serverId, channelEvents],
  );

  return { buildContextMenu };
};
