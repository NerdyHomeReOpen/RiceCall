import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { openServerSetting, favoriteServer, terminateMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerCardCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite'>;
  onJoinServer: () => void;
}

export const useServerCardCtxMenu = ({ user, server, onJoinServer }: UseServerCardCtxMenuProps) => {
  const { t } = useTranslation();

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => openServerSetting(user.userId, server.serverId))
        .addFavoriteServerOption({ isFavorite: server.favorite }, () => favoriteServer(server.serverId))
        .addTerminateSelfMembershipOption({ permissionLevel: server.permissionLevel, isSelf: true }, () => terminateMember(user.userId, server.serverId, t('self')))
        .build(),
    [user, server, onJoinServer, t],
  );

  return { buildContextMenu };
};
