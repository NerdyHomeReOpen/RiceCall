import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
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
  const { isLoading, loadServer } = useLoading();
  const { selectTab } = useMainTab();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  // Variables
  const hasOnline = recommendServer.online >= 0;

  // Functions
  const getServerCardContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinServerOption(handleServerCardClick)
      .addViewServerInfoOption(() => Popup.openServerSetting(user.userId, recommendServer.serverId))
      .build();

  // Handlers
  const handleServerCardClick = () => {
    if (isLoading) return;
    if (recommendServer.serverId === user.currentServerId) {
      selectTab('server');
      return;
    }
    loadServer(recommendServer.specialId || recommendServer.displayId);
    ipc.socket.send('connectServer', { serverId: recommendServer.serverId });
  };

  const handleServerCardContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getServerCardContextMenuItems());
  };

  return (
    <div className={homeStyles['server-card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <Image className={homeStyles['server-avatar-picture']} src={recommendServer.avatarUrl} alt={recommendServer.name} width={70} height={70} loading="lazy" draggable="false" />
      <div className={homeStyles['server-info-text']}>
        <div className={homeStyles['server-name-text']}>{recommendServer.name}</div>
        <div className={homeStyles['server-id-box']}>
          <div className={homeStyles['server-id-text']}>{`ID: ${recommendServer.specialId || recommendServer.displayId}`}</div>
        </div>
        <div className={homeStyles['server-slogen']}>{recommendServer.slogan}</div>
        {hasOnline && (
          <div className={homeStyles['server-online']}>
            {t('online')}: {recommendServer.online}
          </div>
        )}
      </div>
    </div>
  );
});

RecommendServerCard.displayName = 'RecommendServerCard';

export default RecommendServerCard;
