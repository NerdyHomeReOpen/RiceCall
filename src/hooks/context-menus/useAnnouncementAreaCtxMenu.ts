import { useCallback } from 'react';

import ContextMenu from '@/utils/context-menu';

interface UseAnnouncementAreaCtxMenuProps {
  onCloseAnnouncement: () => void;
}

export const useAnnouncementAreaCtxMenu = ({ onCloseAnnouncement }: UseAnnouncementAreaCtxMenuProps) => {
  const buildContextMenu = useCallback(() => new ContextMenu().addCloseAnnouncementOption(onCloseAnnouncement).build(), [onCloseAnnouncement]);

  return { buildContextMenu };
};
