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

interface ServerCardProps {
  server: Types.Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { isLoading, setIsLoading, setLoadingServerId } = useLoading();
  const { setSelectedTabId } = useMainTab();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Variables
  const {
    serverId,
    name: serverName,
    avatarUrl: serverAvatarUrl,
    displayId: serverDisplayId,
    specialId: serverSpecialId,
    slogan: serverSlogan,
    favorite: serverFavorite,
    ownerId: serverOwnerId,
    owned: serverOwned,
    permissionLevel: serverPermissionLevel,
  } = server;
  const { userId, currentServerId: userCurrentServerId } = user;
  const isOwner = serverOwnerId === userId && serverOwned;

  // Handles
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinServerOption(handleServerCardClick)
      .addViewServerInfoOption(() => Popup.openServerSetting(userId, serverId))
      .addFavoriteServerOption({ isFavorite: serverFavorite }, () => Popup.favoriteServer(serverId))
      .addTerminateSelfMembershipOption({ permissionLevel: serverPermissionLevel }, () => Popup.terminateMember(userId, serverId, t('self')))
      .build();

  const handleServerCardClick = () => {
    if (isLoading) return;
    if (server.serverId === userCurrentServerId) {
      setSelectedTabId('server');
      return;
    }
    setIsLoading(true);
    setLoadingServerId(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId });
  };

  const handleServerCardContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getContextMenuItems());
  };

  return (
    <div className={homeStyles['server-card']} onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <Image className={homeStyles['server-avatar-picture']} src={serverAvatarUrl} alt={serverName} width={70} height={70} loading="lazy" draggable="false" />
      <div className={homeStyles['server-info-text']}>
        <div className={homeStyles['server-name-text']}>{serverName}</div>
        <div className={homeStyles['server-id-box']}>
          <div className={`${homeStyles['server-id-text']} ${isOwner ? homeStyles['is-owner'] : ''}`}>{`ID: ${serverSpecialId || serverDisplayId}`}</div>
        </div>
        <div className={homeStyles['server-slogen']}>{serverSlogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
