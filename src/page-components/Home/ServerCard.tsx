import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import * as Types from '@/types';

import { openServerSetting, favoriteServer, terminateMember } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

import ContextMenu from '@/utils/contextMenu';

import styles from './Home.module.css';

interface ServerCardProps {
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();

  const userId = useAppSelector((state) => state.user.data.userId);
  const currentServerId = useAppSelector((state) => state.user.data.currentServerId);

  const serverIsOwned = server.ownerId === userId && server.owned;

  const joinServer = () => {
    if (getIsLoading() || currentServerId === server.serverId) return;
    loadServer(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const handleClick = () => {
    joinServer();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addJoinServerOption(() => {
        joinServer();
      })
      .addViewServerInfoOption(() => {
        openServerSetting(userId, server.serverId);
      })
      .addFavoriteServerOption({ isServerFavorite: server.favorite }, () => {
        favoriteServer(server.serverId);
      })
      .addTerminateSelfMembershipOption({ permissionLevel: server.permissionLevel, isTargetSelf: true }, () => {
        terminateMember(userId, server.serverId, t('self'));
      })
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  return (
    <div className={styles['card']} onClick={handleClick} onContextMenu={handleContextMenu}>
      <div className={styles['card-avatar']}>
        <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={70} height={70} loading="lazy" draggable="false" />
      </div>
      <div className={styles['card-info-text']}>
        <div className={styles['card-name-text']}>{server.name}</div>
        <div className={`${styles['card-id-text']} ${serverIsOwned ? styles['is-owner'] : ''}`}>{`ID: ${server.specialId || server.displayId}`}</div>
        <div className={styles['card-slogan-text']}>{server.slogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
