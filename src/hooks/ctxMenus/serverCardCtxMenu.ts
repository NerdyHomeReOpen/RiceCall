import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UseServerCardContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite'>;
  onJoinServer: () => void;
}

export const useServerCardContextMenu = ({ user, server, onJoinServer }: UseServerCardContextMenuProps) => {
  const { t } = useTranslation();

  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => Action.openServerSetting(user.userId, server.serverId))
        .addFavoriteServerOption({ isFavorite: server.favorite }, () => Action.favoriteServer(server.serverId))
        .addTerminateSelfMembershipOption({ permissionLevel: server.permissionLevel, isSelf: true }, () => Action.terminateMember(user.userId, server.serverId, t('self')))
        .build(),
    [user, server, onJoinServer, t],
  );

  return { buildContextMenu };
};
