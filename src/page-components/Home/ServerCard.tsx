import React from 'react';
import Image from 'next/image';

import * as ipc from '@/main/ipc';

import * as Types from '@/types';

import { useAppSelector } from '@/hooks/useStore';

import { useServerCardCtxMenu } from '@/hooks/ContextMenus/useServerCardCtxMenu';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

import styles from './Home.module.css';

interface ServerCardProps {
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();

  const userId = useAppSelector((state) => state.user.data.userId);
  const currentServerId = useAppSelector((state) => state.user.data.currentServerId);

  const isOwned = server.ownerId === userId && server.owned;

  const joinServer = () => {
    if (getIsLoading() || currentServerId === server.serverId) return;
    loadServer(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const { buildContextMenu: buildServerCardContextMenu } = useServerCardCtxMenu({
    userId,
    serverId: server.serverId,
    serverPermissionLevel: server.permissionLevel,
    serverFavorite: server.favorite,
    onJoinServer: joinServer,
  });

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
    <div className={styles['card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <div className={styles['card-avatar']}>
        <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={70} height={70} loading="lazy" draggable="false" />
      </div>
      <div className={styles['card-info-text']}>
        <div className={styles['card-name-text']}>{server.name}</div>
        <div className={`${styles['card-id-text']} ${isOwned ? styles['is-owner'] : ''}`}>{`ID: ${server.specialId || server.displayId}`}</div>
        <div className={styles['card-slogan-text']}>{server.slogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
