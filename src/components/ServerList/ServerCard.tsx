import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import { useAppSelector } from '@/hooks/Store';

import { useServerCardContextMenu } from '@/hooks/ContextMenus/ServerCard';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import styles from './ServerList.module.css';

interface ServerCardProps {
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const isOwned = server.ownerId === user.userId && server.owned;

  const joinServer = () => {
    if (getIsLoading() || user.currentServerId === server.serverId) return;
    loadServer(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const { buildContextMenu: buildServerCardContextMenu } = useServerCardContextMenu({ user, server, onJoinServer: joinServer });

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
        <Image src={server.avatarUrl} alt="server_avatar" width={70} height={70} loading="lazy" draggable="false" />
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
