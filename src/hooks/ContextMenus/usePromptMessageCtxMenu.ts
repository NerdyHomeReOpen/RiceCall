import { useCallback } from 'react';

import * as Types from '@/types';

import { openUserInfo } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UsePromptMessageCtxMenuProps {
  userId: Types.User['userId'];
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageCtxMenu = (props: UsePromptMessageCtxMenuProps) => {
  const { userId, contentMetadata } = props;

  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new ContextMenu().addViewProfileOption(() => openUserInfo(userId, contentMetadata.userId)).build() : []),
    [userId, contentMetadata],
  );

  return { buildContextMenu };
};
