import { useCallback } from 'react';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UsePromptMessageContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageContextMenu = ({ user, contentMetadata }: UsePromptMessageContextMenuProps) => {
  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new ContextMenu().addViewProfileOption(() => openUserInfo(user.userId, contentMetadata.userId)).build() : []),
    [user, contentMetadata],
  );

  return { buildContextMenu };
};
