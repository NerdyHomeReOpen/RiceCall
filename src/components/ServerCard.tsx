import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import homeStyles from '@/styles/home.module.css';

interface ServerCardProps {
  user: Types.User;
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ user, server }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const loadingBox = useLoading();
  const mainTab = useMainTab();
  const { t } = useTranslation();

  // Variables
  const {
    serverId,
    name: serverName,
    avatarUrl: serverAvatarUrl,
    displayId: serverDisplayId,
    specialId: serverSpecialId,
    slogan: serverSlogan,
    favorite: serverFavorite,
    permissionLevel: serverPermissionLevel,
  } = server;
  const { userId, currentServerId: userCurrentServerId } = user;

  // Handles
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinServerOption(() => selectServer(server))
      .addViewServerInfoOption(() => Popup.openServerSetting(userId, serverId))
      .addFavoriteServerOption({ isFavorite: serverFavorite }, () => handleFavoriteServer(serverId))
      .addTerminateSelfMembershipOption({ permissionLevel: serverPermissionLevel }, () => Popup.terminateMember(userId, serverId, t('self')))
      .build();

  const selectServer = (server: Types.Server) => {
    if (loadingBox.isLoading) return;
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId });
  };

  const handleFavoriteServer = (serverId: Types.Server['serverId']) => {
    ipc.socket.send('favoriteServer', { serverId });
  };

  return (
    <div
      className={homeStyles['server-card']}
      onClick={() => selectServer(server)}
      onContextMenu={(e) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={homeStyles['server-avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homeStyles['server-info-text']}>
        <div className={homeStyles['server-name-text']}>{serverName}</div>
        <div className={homeStyles['server-id-box']}>
          <div className={`${homeStyles['server-id-text']} ${Permission.isServerOwner(serverPermissionLevel) ? homeStyles['is-owner'] : ''}`}>{`ID: ${serverSpecialId || serverDisplayId}`}</div>
        </div>
        <div className={homeStyles['server-slogen']}>{serverSlogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
