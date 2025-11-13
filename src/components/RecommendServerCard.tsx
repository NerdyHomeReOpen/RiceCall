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
import ipc from '@/services/ipc.service';

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

  // Destructuring
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, slogan: serverSlogan, online: serverOnline } = recommendServer;
  const { userId, currentServerId: userCurrentServerId } = user;

  // Handles
  const handleServerSelect = (serverId: RecommendServer['serverId'], serverDisplayId: RecommendServer['displayId']) => {
    if (loadingBox.isLoading) return;
    if (serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);
    ipc.socket.send('connectServer', { serverId });
  };

  return (
    <div
      className={homePage['server-card']}
      onClick={() => handleServerSelect(serverId, serverDisplayId)}
      onContextMenu={(e) => {
        e.preventDefault();
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
            disabled: true,
            onClick: () => handleOpenServerSetting(userId, serverId),
          },
        ]);
      }}
    >
      <div className={homePage['server-avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }}></div>
      <div className={homePage['server-info-text']}>
        <div className={homePage['server-name-text']}>{serverName}</div>
        <div className={homePage['server-id-box']}>
          <div className={homePage['server-id-text']}>{`ID: ${serverDisplayId}`}</div>
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
