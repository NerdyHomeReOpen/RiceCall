import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/contextMenu';

interface UseRecommendServerContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  recommendServer: Pick<Types.RecommendServer, 'serverId'>;
  onJoinServer: () => void;
}

export const useRecommendServerContextMenu = ({ user, recommendServer, onJoinServer }: UseRecommendServerContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => Actions.openServerSetting(user.userId, recommendServer.serverId))
        .build(),
    [user, recommendServer, onJoinServer],
  );

  return { buildContextMenu };
};
