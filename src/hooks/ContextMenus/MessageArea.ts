import { useCallback } from 'react';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UseMessageAreaContextMenuProps {
  onOpenAnnouncement: () => void;
  onClearMessages: () => void;
}

export const useMessageAreaContextMenu = ({ onOpenAnnouncement, onClearMessages }: UseMessageAreaContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCleanUpMessageOption(onClearMessages)
        .addOpenChannelEventOption(() => Actions.openChannelEvent())
        .addOpenAnnouncementOption(onOpenAnnouncement)
        .build(),
    [onClearMessages, onOpenAnnouncement],
  );

  return { buildContextMenu };
};
