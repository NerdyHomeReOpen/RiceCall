import { useCallback } from 'react';

import { openChannelEvent } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseMessageAreaCtxMenuProps {
  onOpenAnnouncement: () => void;
  onClearMessages: () => void;
}

export const useMessageAreaCtxMenu = ({ onOpenAnnouncement, onClearMessages }: UseMessageAreaCtxMenuProps) => {
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
