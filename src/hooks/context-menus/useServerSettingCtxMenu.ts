import { useCallback } from 'react';

import type * as Types from '@/types';

import { REPORT_BASE_URL } from '@/constants';

import { applyMember, openServerSetting, openEditNickname, favoriteServer } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UseServerSettingCtxMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'isFavorite' | 'receiveApply'>;
  onLocateMe: () => void;
}

export const useServerSettingCtxMenu = ({ user, currentServer, onLocateMe }: UseServerSettingCtxMenuProps): Types.ContextMenuBuilder => {
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
        .addReportOption(() => window.open(`${REPORT_BASE_URL}?type=server&id=${encodeURIComponent(currentServer.serverId)}`, '_blank'))
        .addFavoriteServerOption({ isFavorite: currentServer.isFavorite }, () => favoriteServer(currentServer.serverId))
        .build(),
    [user, currentServer, permissionLevel, onLocateMe],
  );

  return { buildContextMenu };
};
