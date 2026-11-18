import { useCallback } from 'react';

import type * as Types from '@/types';

import { openServerSetting } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UseRecommendServerCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  recommendServer: Pick<Types.RecommendServer, 'serverId'>;
  onJoinServer: () => void;
}

export const useRecommendServerCtxMenu = ({ user, recommendServer, onJoinServer }: UseRecommendServerCtxMenuProps): Types.ContextMenuBuilder => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => openServerSetting(user.userId, recommendServer.serverId))
        .build(),
    [user, recommendServer, onJoinServer],
  );

  return { buildContextMenu };
};
