import { useCallback } from 'react';

import ContextMenu from '@/contextMenu';

interface UseAnnouncementAreaContextMenuProps {
  onCloseAnnouncement: () => void;
}

export const useAnnouncementAreaContextMenu = ({ onCloseAnnouncement }: UseAnnouncementAreaContextMenuProps) => {
  const buildContextMenu = useCallback(
    () => new ContextMenu().addCloseAnnouncementOption(onCloseAnnouncement).build(),
    [onCloseAnnouncement],
  );

  return { buildContextMenu };
};
