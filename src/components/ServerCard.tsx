import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import homeStyles from '@/styles/home.module.css';

interface ServerCardProps {
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  // Variables
  const isOwned = server.ownerId === user.userId && server.owned;

  // Functions
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinServerOption(handleServerCardClick)
      .addViewServerInfoOption(() => Popup.openServerSetting(user.userId, server.serverId))
      .addFavoriteServerOption({ isFavorite: server.favorite }, () => Popup.favoriteServer(server.serverId))
      .addTerminateSelfMembershipOption({ permissionLevel: server.permissionLevel }, () => Popup.terminateMember(user.userId, server.serverId, t('self')))
      .build();

  // Handles
  const handleServerCardClick = () => {
    if (getIsLoading() || user.currentServerId === server.serverId) return;
    loadServer(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const handleServerCardContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getContextMenuItems());
  };

  return (
    <div className={homeStyles['server-card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <Image className={homeStyles['server-avatar-picture']} src={server.avatarUrl} alt={server.name} width={70} height={70} loading="lazy" draggable="false" />
      <div className={homeStyles['server-info-text']}>
        <div className={homeStyles['server-name-text']}>{server.name}</div>
        <div className={homeStyles['server-id-box']}>
          <div className={`${homeStyles['server-id-text']} ${isOwned ? homeStyles['is-owner'] : ''}`}>{`ID: ${server.specialId || server.displayId}`}</div>
        </div>
        <div className={homeStyles['server-slogen']}>{server.slogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
