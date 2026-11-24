import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useAppSelector } from '@/hooks/useStore';
import { useRecommendServerCtxMenu } from '@/hooks/context-menus/useRecommendServerCtxMenu';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

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

  const joinServer = () => {
    if (getIsLoading() || user.currentServerId === recommendServer.serverId) return;
    loadServer(recommendServer.specialId || recommendServer.displayId);
    ipc.socket.send('connectServer', { serverId: recommendServer.serverId });
  };

  const { buildContextMenu: buildServerCardContextMenu } = useRecommendServerCtxMenu({ user, recommendServer, onJoinServer: joinServer });

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
    <div className="flex items-center w-[270px] h-[90px] p-[10px] cursor-pointer bg-background border border-border" onClick={handleServerCardClick} onContextMenu={handleServerCardContextMenu}>
      <div className="w-[70px] h-[70px]">
        <Image src={recommendServer.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={70} height={70} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-1 flex-col justify-between w-full h-full ml-[10px] truncate">
        <div className="truncate text-text-link">{recommendServer.name}</div>
        <div className="flex items-center text-text-color-quaternary">{`ID: ${recommendServer.specialId || recommendServer.displayId}`}</div>
        <div className="flex items-center h-[1rem] text-text-color-quaternary">{recommendServer.slogan}</div>
        <div className="flex items-center h-[1rem] text-text-color-quaternary">
          {t('online')}: {recommendServer.online}
        </div>
      </div>
    </div>
  );
});

RecommendServerCard.displayName = 'RecommendServerCard';

export default RecommendServerCard;
