import React from 'react';

// CSS
import homePage from '@/styles/home.module.css';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';
import { useTranslation } from 'react-i18next';

// Type
import type { User, RecommendServer } from '@/types';

// Services
import ipc from '@/ipc';

// Utils
import { handleOpenServerSetting } from '@/utils/popup';

interface RecommendServerCardProps {
  user: User;
  recommendServer: RecommendServer;
}

const RecommendServerCard: React.FC<RecommendServerCardProps> = React.memo(({ user, recommendServer }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const loadingBox = useLoading();
  const mainTab = useMainTab();
  const { t } = useTranslation();

  // Variables
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, specialId: serverSpecialId, displayId: serverDisplayId, slogan: serverSlogan, online: serverOnline } = recommendServer;
  const { userId, currentServerId: userCurrentServerId } = user;

  // Handles
  const getContextMenuItems = () => [
    {
      id: 'join-server',
      label: t('join-server'),
      onClick: () => handleServerSelect(recommendServer),
    },
    {
      id: 'view-server-info',
      label: t('view-server-info'),
      disabled: true,
      onClick: () => handleOpenServerSetting(userId, serverId),
    },
  ];

  const handleServerSelect = (server: RecommendServer) => {
    if (loadingBox.isLoading) return;
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId });
  };

  return (
    <div
      className={homePage['server-card']}
      onClick={() => handleServerSelect(recommendServer)}
      onContextMenu={(e) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={homePage['server-avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homePage['server-info-text']}>
        <div className={homePage['server-name-text']}>{serverName}</div>
        <div className={homePage['server-id-box']}>
          <div className={homePage['server-id-text']}>{`ID: ${serverSpecialId || serverDisplayId}`}</div>
        </div>
        <div className={homePage['server-slogen']}>{serverSlogan}</div>
        {serverOnline >= 0 && (
          <div className={homePage['server-online']}>
            {t('online')}: {serverOnline}
          </div>
        )}
      </div>
    </div>
  );
});

RecommendServerCard.displayName = 'RecommendServerCard';

export default RecommendServerCard;
