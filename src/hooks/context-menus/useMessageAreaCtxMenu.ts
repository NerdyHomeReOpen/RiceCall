import { useCallback } from 'react';

import type * as Types from '@/types';

import { openChannelEvent } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UseMessageAreaCtxMenuProps {
  onOpenAnnouncement: () => void;
  onClearMessages: () => void;
}

export const useMessageAreaCtxMenu = ({ onOpenAnnouncement, onClearMessages }: UseMessageAreaCtxMenuProps): Types.ContextMenuBuilder => {
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
