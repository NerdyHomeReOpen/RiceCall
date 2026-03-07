import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UsePromptMessageContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageContextMenu = ({ user, contentMetadata }: UsePromptMessageContextMenuProps) => {
  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new CtxMenuBuilder().addViewProfileOption(() => Action.openUserInfo(user.userId, contentMetadata.userId)).build() : []),
    [user, contentMetadata],
  );

  return { buildContextMenu };
};
