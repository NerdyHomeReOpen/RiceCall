import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/utils/contextMenu';

interface UseServerCardContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  server: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite'>;
  onJoinServer: () => void;
}

export const useServerCardContextMenu = ({ user, server, onJoinServer }: UseServerCardContextMenuProps) => {
  const { t } = useTranslation();

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => Actions.openServerSetting(user.userId, server.serverId))
        .addFavoriteServerOption({ isFavorite: server.favorite }, () => Actions.favoriteServer(server.serverId))
        .addTerminateSelfMembershipOption({ permissionLevel: server.permissionLevel, isSelf: true }, () => Actions.terminateMember(user.userId, server.serverId, t('self')))
        .build(),
    [user, server, onJoinServer, t],
  );

  return { buildContextMenu };
};
