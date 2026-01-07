import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';
import { useMainTab } from '@/providers/MainTab';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import homeStyles from '@/styles/home.module.css';

interface RecommendServerCardProps {
  recommendServer: Types.RecommendServer;
}

const RecommendServerCard: React.FC<RecommendServerCardProps> = React.memo(({ recommendServer }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { isLoading, setIsLoading, setLoadingServerId } = useLoading();
  const { setSelectedTabId } = useMainTab();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Variables
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, specialId: serverSpecialId, displayId: serverDisplayId, slogan: serverSlogan, online: serverOnline } = recommendServer;
  const { userId, currentServerId: userCurrentServerId } = user;

  // Functions
  const getServerCardContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinServerOption(handleServerCardClick)
      .addViewServerInfoOption(() => Popup.openServerSetting(userId, serverId))
      .build();

  // Handlers
  const handleServerCardClick = () => {
    if (isLoading) return;
    if (serverId === userCurrentServerId) {
      setSelectedTabId('server');
      return;
    }
    setIsLoading(true);
    setLoadingServerId(serverSpecialId || serverDisplayId);
    ipc.socket.send('connectServer', { serverId });
  };

  const handleServerCardContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getServerCardContextMenuItems());
  };

  return (
    <div className={homeStyles['server-card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <Image className={homeStyles['server-avatar-picture']} src={serverAvatarUrl} alt={serverName} width={70} height={70} loading="lazy" draggable="false" />
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
