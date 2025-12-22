import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';

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
  const getContextMenuItems = () => [
    {
      id: 'join-server',
      label: t('join-server'),
      onClick: () => handleServerSelect(server),
    },
    {
      id: 'view-server-info',
      label: t('view-server-info'),
      onClick: () => Popup.handleOpenServerSetting(userId, serverId),
    },
    {
      id: 'set-favorite',
      label: !serverFavorite ? t('favorite') : t('unfavorite'),
      onClick: () => handleFavoriteServer(serverId),
    },
    {
      id: 'terminate-self-membership',
      label: t('terminate-self-membership'),
      show: Permission.isMember(serverPermissionLevel) && !Permission.isServerOwner(serverPermissionLevel),
      onClick: () => handleTerminateMember(userId, serverId, t('self')),
    },
  ];

  const handleServerSelect = (server: Types.Server) => {
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

  const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], memberName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': memberName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  return (
    <div
      className={homeStyles['server-card']}
      onClick={() => handleServerSelect(server)}
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
