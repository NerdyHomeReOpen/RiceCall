import React from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';
import { useTranslation } from 'react-i18next';

// Type
import type { User, Server } from '@/types';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenServerSetting } from '@/utils/popup';
import { isMember, isServerOwner } from '@/utils/permission';

interface ServerCardProps {
  user: User;
  server: Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ user, server }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const loadingBox = useLoading();
  const mainTab = useMainTab();
  const { t } = useTranslation();

  // Destructuring
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, slogan: serverSlogan, favorite: serverFavorite, permissionLevel: serverPermissionLevel } = server;
  const { userId, currentServerId: userCurrentServerId } = user;

  // Handles
  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    if (loadingBox.isLoading) return;
    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);
    ipc.socket.send('connectServer', { serverId });
  };

  const handleFavoriteServer = (serverId: Server['serverId']) => {
    ipc.socket.send('favoriteServer', { serverId });
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], memberName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': memberName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  return (
    <div
      className={homePage['server-card']}
      onClick={() => handleServerSelect(serverId, serverDisplayId)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'join-server',
            label: t('join-server'),
            onClick: () => handleServerSelect(serverId, serverDisplayId),
          },
          {
            id: 'view-server-info',
            label: t('view-server-info'),
            onClick: () => handleOpenServerSetting(userId, serverId),
          },
          {
            id: 'set-favorite',
            label: !serverFavorite ? t('favorite') : t('unfavorite'),
            onClick: () => handleFavoriteServer(serverId),
          },
          {
            id: 'terminate-self-membership',
            label: t('terminate-self-membership'),
            show: isMember(serverPermissionLevel) && !isServerOwner(serverPermissionLevel),
            onClick: () => handleTerminateMember(userId, serverId, t('self')),
          },
        ]);
      }}
    >
      <div className={homePage['server-avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homePage['server-info-text']}>
        <div className={homePage['server-name-text']}>{serverName}</div>
        <div className={homePage['server-id-box']}>
          <div className={`${homePage['server-id-text']} ${isServerOwner(serverPermissionLevel) ? homePage['is-owner'] : ''}`}>{`ID: ${serverDisplayId}`}</div>
        </div>
        <div className={homePage['server-slogen']}>{serverSlogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
