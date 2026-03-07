import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Action from '@/action';

import CtxMenuBuilder from '@/hooks/ctxMenus/ctxMenuBuilder';

interface UseServerSettingContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite' | 'receiveApply'>;
  onLocateMe: () => void;
}

export const useServerSettingContextMenu = ({ user, currentServer, onLocateMe }: UseServerSettingContextMenuProps) => {
  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);

  const buildContextMenu = useCallback(
    () =>
      new CtxMenuBuilder()
        .addApplyMemberOption({ permissionLevel }, () => Action.applyMember(user.userId, currentServer.serverId, currentServer.receiveApply))
        .addServerSettingOption({ permissionLevel }, () => Action.openServerSetting(user.userId, currentServer.serverId))
        .addSeparator()
        .addEditNicknameOption({ permissionLevel, isSelf: true, isLowerLevel: false }, () => Action.openEditNickname(user.userId, currentServer.serverId))
        .addLocateMeOption(() => onLocateMe())
        .addSeparator()
        .addReportOption(() => window.open('https://ricecall.com/report-server', '_blank'))
        .addFavoriteServerOption({ isFavorite: currentServer.favorite }, () => Action.favoriteServer(currentServer.serverId))
        .build(),
    [user, currentServer, permissionLevel, onLocateMe],
  );

  return { buildContextMenu };
};
