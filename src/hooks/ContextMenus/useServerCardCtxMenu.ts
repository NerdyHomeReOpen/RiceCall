import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openServerSetting, favoriteServer, terminateMember } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerCardCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  serverPermissionLevel: Types.Server['permissionLevel'];
  serverFavorite: Types.Server['favorite'];
  onJoinServer: () => void;
}

export const useServerCardCtxMenu = (props: UseServerCardCtxMenuProps) => {
  const { t } = useTranslation();

  const { userId, serverId, serverPermissionLevel, serverFavorite, onJoinServer } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addJoinServerOption(onJoinServer)
        .addViewServerInfoOption(() => openServerSetting(userId, serverId))
        .addFavoriteServerOption({ isFavorite: serverFavorite }, () => favoriteServer(serverId))
        .addTerminateSelfMembershipOption({ permissionLevel: serverPermissionLevel, isSelf: true }, () => terminateMember(userId, serverId, t('self')))
        .build(),
    [userId, serverId, serverPermissionLevel, serverFavorite, onJoinServer, t],
  );

  return { buildContextMenu };
};
