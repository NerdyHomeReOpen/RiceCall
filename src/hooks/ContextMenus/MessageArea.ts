import { useCallback } from 'react';

import { openChannelEvent } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseMessageAreaContextMenuProps {
  onOpenAnnouncement: () => void;
  onClearMessages: () => void;
}

export const useMessageAreaContextMenu = ({ onOpenAnnouncement, onClearMessages }: UseMessageAreaContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addCleanUpMessageOption(onClearMessages)
        .addOpenChannelEventOption(() => openChannelEvent())
        .addOpenAnnouncementOption(onOpenAnnouncement)
        .build(),
    [onClearMessages, onOpenAnnouncement],
  );

  return { buildContextMenu };
};
