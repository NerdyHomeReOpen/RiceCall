import { useCallback } from 'react';

import * as Types from '@/types';

import { applyMember, openServerSetting, openEditNickname, favoriteServer } from '@/services';

import ContextMenu from '@/utils/contextMenu';

interface UseServerSettingCtxMenuProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  isServerReceiveApply: Types.Server['receiveApply'];
  isServerFavorite: Types.Server['favorite'];
  permissionLevel: Types.Permission;
  onLocateMe: () => void;
}

export const useServerSettingCtxMenu = (props: UseServerSettingCtxMenuProps) => {
  const { userId, serverId, isServerReceiveApply, isServerFavorite, permissionLevel, onLocateMe } = props;

  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addApplyMemberOption({ permissionLevel }, () => applyMember(userId, serverId, isServerReceiveApply))
        .addServerSettingOption({ permissionLevel }, () => openServerSetting(userId, serverId))
        .addSeparator()
        .addEditNicknameOption({ permissionLevel, isSelf: true, isLowerLevel: false }, () => openEditNickname(userId, serverId))
        .addLocateMeOption(() => onLocateMe())
        .addSeparator()
        .addReportOption(() => window.open('https://ricecall.com/report-server', '_blank'))
        .addFavoriteServerOption({ isFavorite: isServerFavorite }, () => favoriteServer(serverId))
        .build(),
    [userId, serverId, isServerReceiveApply, isServerFavorite, permissionLevel, onLocateMe],
  );

  return { buildContextMenu };
};
