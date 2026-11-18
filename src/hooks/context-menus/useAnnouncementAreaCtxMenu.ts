import { useCallback } from 'react';

import type * as Types from '@/types';

import ContextMenu from '@/utils/context-menu';

interface UseAnnouncementAreaCtxMenuProps {
  onCloseAnnouncement: () => void;
}

export const useAnnouncementAreaCtxMenu = ({ onCloseAnnouncement }: UseAnnouncementAreaCtxMenuProps): Types.ContextMenuBuilder => {
  const buildContextMenu = useCallback(() => new ContextMenu().addCloseAnnouncementOption(onCloseAnnouncement).build(), [onCloseAnnouncement]);

  return { buildContextMenu };
};
