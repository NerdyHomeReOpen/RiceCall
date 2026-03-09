import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UseRecommendServerContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  recommendServer: Pick<Types.RecommendServer, 'serverId'>;
  onJoinServer: () => void;
}

export const useRecommendServerContextMenu = ({ user, recommendServer, onJoinServer }: UseRecommendServerContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => Action.openServerSetting(user.userId, recommendServer.serverId))
        .build(),
    [user, recommendServer, onJoinServer],
  );

  return { buildContextMenu };
};
