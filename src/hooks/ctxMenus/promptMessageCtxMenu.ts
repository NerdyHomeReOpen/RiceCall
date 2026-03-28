import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import ContextMenu from '@/contextMenu';

interface UsePromptMessageContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageContextMenu = ({ user, contentMetadata }: UsePromptMessageContextMenuProps) => {
  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new ContextMenu().addViewProfileOption(() => Action.openUserInfo(user.userId, contentMetadata.userId)).build() : []),
    [user, contentMetadata],
  );

  return { buildContextMenu };
};
