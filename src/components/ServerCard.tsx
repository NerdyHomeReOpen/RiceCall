import React from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useSocket } from '@/providers/Socket';

// Type
import { PopupType, UserServer, User, Member, Server } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

interface ServerCardProps {
  user: User;
  server: UserServer;
  onClick?: () => void;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(
  ({ user, server, onClick }) => {
    // Hooks
    const contextMenu = useContextMenu();
    const socket = useSocket();

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

    const { userId } = user;
    const isOwner = serverOwnerId === userId;
    const canRemoveMemberShip =
      serverPermissionLevel > 1 && serverPermissionLevel < 6 && !isOwner;

    // Handles
    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.editMember({
        member,
        userId,
        serverId,
      });
    };

    const handleRemoveMembership = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        '確定要解除自己與語音群的會員關係嗎', // lang.tr
        () => {
          handleUpdateMember({ permissionLevel: 1 }, userId, serverId);
        },
      );
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
        onClick={onClick}
        onContextMenu={(e) => {
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'joinServer',
              label: '進入', // TODO: lang.tr
              onClick: onClick,
            },
            {
              id: 'viewServerInfo',
              label: '查看群資料', // TODO: lang.tr
              disabled: true,
              onClick: () => {
                /* TODO: handleOpenServerSetting(userId, serverId); */
              },
            },
            {
              id: 'setFavorite',
              label: !serverFavorite ? '加入收藏' : '取消收藏', // TODO: lang.tr
              onClick: () => {
                handleFavoriteServer(serverId);
              },
            },
            {
              id: 'removeMemberShip',
              label: '解除會員關係', // TODO: lang.tr
              show: canRemoveMemberShip,
              onClick: () => {
                handleRemoveMembership(userId, serverId);
              },
            },
          ]);
        }}
      >
        <div
          className={homePage['serverAvatarPicture']}
          style={{ backgroundImage: `url(${serverAvatarUrl})` }}
        ></div>
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
  },
);

ServerCard.displayName = 'ServerCard';

export default ServerCard;
