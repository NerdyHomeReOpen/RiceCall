import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import { useAppSelector } from '@/hooks/Store';
import { useRecommendServerContextMenu } from '@/hooks/ContextMenus/RecommendServer';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import styles from '@/pages/Home/Home.module.css';

interface RecommendServerCardProps {
  recommendServer: Types.RecommendServer;
}

const RecommendServerCard: React.FC<RecommendServerCardProps> = React.memo(({ recommendServer }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const hasOnline = recommendServer.online >= 0;

  const joinServer = () => {
    if (getIsLoading() || user.currentServerId === recommendServer.serverId) return;
    loadServer(recommendServer.specialId || recommendServer.displayId);
    ipc.socket.send('connectServer', { serverId: recommendServer.serverId });
  };

  const { buildContextMenu: buildServerCardContextMenu } = useRecommendServerContextMenu({ user, recommendServer, onJoinServer: joinServer });

  const handleServerCardClick = () => {
    joinServer();
  };

  const handleServerCardContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildServerCardContextMenu());
  };

  return (
    <div className={styles['server-card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <Image className={styles['server-avatar-picture']} src={recommendServer.avatarUrl} alt={recommendServer.name} width={70} height={70} loading="lazy" draggable="false" />
      <div className={styles['server-info-text']}>
        <div className={styles['server-name-text']}>{recommendServer.name}</div>
        <div className={styles['server-id-box']}>
          <div className={styles['server-id-text']}>{`ID: ${recommendServer.specialId || recommendServer.displayId}`}</div>
        </div>
        <div className={styles['server-slogen']}>{recommendServer.slogan}</div>
        {hasOnline && (
          <div className={styles['server-online']}>
            {t('online')}: {recommendServer.online}
          </div>
        )}
      </div>
    </div>
  );
});

RecommendServerCard.displayName = 'RecommendServerCard';

export default RecommendServerCard;
