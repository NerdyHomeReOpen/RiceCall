import { useCallback } from 'react';

import * as Types from '@/types';

import { openServerSetting } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseRecommendServerCtxMenuProps {
  userId: Types.User['userId'];
  recommendServerId: Types.RecommendServer['serverId'];
  onJoinServer: () => void;
}

export const useRecommendServerCtxMenu = (props: UseRecommendServerCtxMenuProps) => {
  const { userId, recommendServerId, onJoinServer } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => openServerSetting(userId, recommendServerId))
        .build(),
    [userId, recommendServerId, onJoinServer],
  );

  return { buildContextMenu };
};
