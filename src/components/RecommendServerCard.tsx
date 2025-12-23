import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';

import { handleOpenServerSetting } from '@/utils/popup';

import homeStyles from '@/styles/home.module.css';

interface RecommendServerCardProps {
  user: Types.User;
  recommendServer: Types.RecommendServer;
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

  const handleServerSelect = (server: Types.RecommendServer) => {
    if (loadingBox.isLoading) return;
    if (server.serverId === userCurrentServerId) {
      mainTab.setSelectedTabId('server');
      return;
    }
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  return (
    <div
      className={homeStyles['server-card']}
      onClick={() => handleServerSelect(recommendServer)}
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
          <div className={homeStyles['server-id-text']}>{`ID: ${serverSpecialId || serverDisplayId}`}</div>
        </div>
        <div className={homeStyles['server-slogen']}>{serverSlogan}</div>
        {serverOnline >= 0 && (
          <div className={homeStyles['server-online']}>
            {t('online')}: {serverOnline}
          </div>
        )}
      </div>
    </div>
  );
});

RecommendServerCard.displayName = 'RecommendServerCard';

export default RecommendServerCard;
