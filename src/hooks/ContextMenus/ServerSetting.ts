import { useCallback } from 'react';

import type * as Types from '@/types';

import * as Actions from '@/action';

import ContextMenu from '@/utils/contextMenu';

interface UseServerSettingContextMenuProps {
  user: Pick<Types.User, 'userId' | 'permissionLevel'>;
  currentServer: Pick<Types.Server, 'serverId' | 'permissionLevel' | 'favorite' | 'receiveApply'>;
  onLocateMe: () => void;
}

export const useServerSettingContextMenu = ({ user, currentServer, onLocateMe }: UseServerSettingContextMenuProps) => {
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addApplyMemberOption({ permissionLevel }, () => Actions.applyMember(user.userId, currentServer.serverId, currentServer.receiveApply))
        .addServerSettingOption({ permissionLevel }, () => Actions.openServerSetting(user.userId, currentServer.serverId))
        .addSeparator()
        .addEditNicknameOption({ permissionLevel, isSelf: true, isLowerLevel: false }, () => Actions.openEditNickname(user.userId, currentServer.serverId))
        .addLocateMeOption(() => onLocateMe())
        .addSeparator()
        .addReportOption(() => window.open('https://ricecall.com/report-server', '_blank'))
        .addFavoriteServerOption({ isFavorite: currentServer.favorite }, () => Actions.favoriteServer(currentServer.serverId))
        .build(),
    [user, currentServer, permissionLevel, onLocateMe],
  );

  return { buildContextMenu };
};
