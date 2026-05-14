import { useCallback } from 'react';

import type * as Types from '@/types';

import { applyMember, openServerSetting, openEditNickname, favoriteServer } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerSettingCtxMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite' | 'receiveApply'>;
  onLocateMe: () => void;
}

export const useServerSettingCtxMenu = ({ user, currentServer, onLocateMe }: UseServerSettingCtxMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addApplyMemberOption({ permissionLevel }, () => applyMember(user.userId, currentServer.serverId, currentServer.receiveApply))
        .addServerSettingOption({ permissionLevel }, () => openServerSetting(user.userId, currentServer.serverId))
        .addSeparator()
        .addEditNicknameOption({ permissionLevel, isSelf: true, isLowerLevel: false }, () => openEditNickname(user.userId, currentServer.serverId))
        .addLocateMeOption(() => onLocateMe())
        .addSeparator()
        .addReportOption(() => window.open('https://ricecall.com/report-server', '_blank'))
        .addFavoriteServerOption({ isFavorite: currentServer.favorite }, () => favoriteServer(currentServer.serverId))
        .build(),
    [user, currentServer, permissionLevel, onLocateMe],
  );

  return { buildContextMenu };
};
