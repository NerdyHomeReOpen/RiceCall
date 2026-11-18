import { useCallback } from 'react';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UsePromptMessageCtxMenuProps {
  contentMetadata: Types.PromptMessage['contentMetadata'];
}

export const usePromptMessageCtxMenu = ({ contentMetadata }: UsePromptMessageCtxMenuProps) => {
  const buildContextMenu = useCallback(
    () => (contentMetadata && contentMetadata.userId ? new ContextMenu().addViewProfileOption(() => openUserInfo(contentMetadata.userId)).build() : []),
    [contentMetadata],
  );

  return { buildContextMenu };
};
