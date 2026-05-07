import { useCallback } from 'react';

import type * as Types from '@/types';

import { openServerSetting } from '@/services';

import ContextMenu from '@/utils/contextMenu';

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
        .addViewServerInfoOption(() => openServerSetting(user.userId, recommendServer.serverId))
        .build(),
    [user, recommendServer, onJoinServer],
  );

  return { buildContextMenu };
};
