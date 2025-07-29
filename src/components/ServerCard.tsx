import React from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';
import { useTranslation } from 'react-i18next';

// Type
import { UserServer, User, Member, Server } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

interface ServerCardProps {
  user: User;
  server: UserServer;
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
    slogan: serverSlogan,
    ownerId: serverOwnerId,
    favorite: serverFavorite,
    permissionLevel: serverPermissionLevel,
    // online: serverOnline
  } = server;

  const { userId, currentServerId: userCurrentServerId } = user;
  const isOwner = serverOwnerId === userId;
  const canRemoveMemberShip = serverPermissionLevel > 1 && serverPermissionLevel < 6 && !isOwner;

  // Handles
  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);

    setTimeout(() => {
      ipcService.socket.send('connectServer', { serverId });
    }, loadingBox.loadingTimeStamp);
  };

  const handleFavoriteServer = (serverId: Server['serverId']) => {
    ipcService.socket.send('favoriteServer', { serverId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', {
      message: message,
      submitTo: 'alertDialog',
    });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.socket.send('editMember', { userId, serverId, update: member });
  };

  const handleRemoveMembership = (userId: User['userId'], serverId: Server['serverId'], memberName: User['name']) => {
    handleOpenAlertDialog(t('confirm-remove-membership', { '0': memberName }), () => {
      handleEditMember({ permissionLevel: 1, nickname: null }, userId, serverId);
    });
  };

  return (
    <div
      className={homePage['server-card']}
      onClick={() => handleServerSelect(serverId, serverDisplayId)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
          {
            id: 'join-server',
            label: t('join-server'),
            onClick: () => handleServerSelect(serverId, serverDisplayId),
          },
          {
            id: 'view-server-info',
            label: t('view-server-info'),
            disabled: true,
            onClick: () => {
              /* TODO: handleOpenServerSetting(userId, serverId); */
            },
          },
          {
            id: 'set-favorite',
            label: !serverFavorite ? t('favorite') : t('unfavorite'),
            onClick: () => {
              handleFavoriteServer(serverId);
            },
          },
          {
            id: 'remove-self-membership',
            label: t('remove-self-membership'),
            show: canRemoveMemberShip,
            onClick: () => {
              handleRemoveMembership(userId, serverId, t('self'));
            },
          },
        ]);
      }}
    >
      <div className={homePage['server-avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homePage['server-info-text']}>
        <div className={homePage['server-name-text']}>{serverName}</div>
        <div className={homePage['server-id-box']}>
          <div
            className={`
                ${homePage['server-id-text']} 
                ${isOwner ? homePage['is-owner'] : ''}
              `}
          >
            ID:
          </div>
          <div className={homePage['server-id-text']}>{serverDisplayId}</div>
        </div>
        <div className={homePage['server-slogen']}>{serverSlogan}</div>
        {/* {serverOnline !== undefined && serverOnline >= 0 && (
          <div className={homePage['server-online']}>
            {t('online')}: {serverOnline}
          </div>
        )} */}
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
