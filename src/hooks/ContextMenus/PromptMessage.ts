import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UsePromptMessageContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageContextMenu = ({ user, contentMetadata }: UsePromptMessageContextMenuProps) => {
  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new ContextMenu().addViewProfileOption(() => Actions.openUserInfo(user.userId, contentMetadata.userId)).build() : []),
    [user, contentMetadata],
  );

  return { buildContextMenu };
};
