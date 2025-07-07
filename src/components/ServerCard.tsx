import React from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useSocket } from '@/providers/Socket';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';
import { useTranslation } from 'react-i18next';

// Type
import { PopupType, UserServer, User, Member, Server } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

interface ServerCardProps {
  user: User;
  server: UserServer;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ user, server }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const socket = useSocket();
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
  } = server;

  const { userId, currentServerId: userCurrentServerId } = user;
  const isOwner = serverOwnerId === userId;
  const canRemoveMemberShip = serverPermissionLevel > 1 && serverPermissionLevel < 6 && !isOwner;

  // Handles
  const handleServerSelect = (
    userId: User['userId'],
    serverId: Server['serverId'],
    serverDisplayId: Server['displayId'],
  ) => {
    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);

    setTimeout(() => {
      socket.send.connectServer({ userId, serverId });
    }, loadingBox.loadingTimeStamp);
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', {
      title: message,
      submitTo: 'alertDialog',
    });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.editMember({
      member,
      userId,
      serverId,
    });
  };

  const handleRemoveMembership = (userId: User['userId'], serverId: Server['serverId'], memberName: User['name']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-remove-membership').replace('{0}', memberName), () => {
      handleEditMember({ permissionLevel: 1, nickname: null }, userId, serverId);
    });
  };

  const handleFavoriteServer = (serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.favoriteServer({
      serverId,
    });
  };

  return (
    <div
      className={homePage['serverCard']}
      onClick={() => handleServerSelect(userId, serverId, serverDisplayId)}
      onContextMenu={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
          {
            id: 'join-server',
            label: t('join-server'),
            onClick: () => handleServerSelect(userId, serverId, serverDisplayId),
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
      <div className={homePage['serverAvatarPicture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homePage['serverInfoText']}>
        <div className={homePage['serverNameText']}>{serverName}</div>
        <div className={homePage['serverIdBox']}>
          <div
            className={`
                ${homePage['serverIdText']} 
                ${isOwner ? homePage['IsOwner'] : ''}
              `}
          >
            ID:
          </div>
          <div className={homePage['serverIdText']}>{serverDisplayId}</div>
        </div>
        <div className={homePage['serverSlogen']}>{serverSlogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
