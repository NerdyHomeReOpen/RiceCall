import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import { useAppSelector } from '@/hooks/useStore';
import { useServerCardCtxMenu } from '@/hooks/context-menus/useServerCardCtxMenu';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

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

  const isOwned = server.ownerId === user.userId && server.isOwned;

  const joinServer = () => {
    if (getIsLoading() || user.currentServerId === server.serverId) return;
    loadServer(server.specialId || server.displayId);
    ipc.socket.send('connectServer', { serverId: server.serverId });
  };

  const { buildContextMenu: buildServerCardContextMenu } = useServerCardCtxMenu({ user, server, onJoinServer: joinServer });

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
        <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={70} height={70} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-1 flex-col justify-between w-full h-full ml-[10px] truncate">
        <div className="truncate text-text-link">{server.name}</div>
        <div
          className={`flex items-center text-text-color-quaternary ${isOwned ? "before:block before:w-[13px] before:h-[15px] before:mr-[2px] before:content-[''] before:bg-[url('/icon_creator.svg')] before:bg-position-[0_0] before:bg-contain" : ''}`}
        >{`ID: ${server.specialId || server.displayId}`}</div>
        <div className="flex items-center h-[1rem] text-text-color-quaternary">{server.slogan}</div>
      </div>
    </div>
  );
});

ServerCard.displayName = 'ServerCard';

export default ServerCard;
