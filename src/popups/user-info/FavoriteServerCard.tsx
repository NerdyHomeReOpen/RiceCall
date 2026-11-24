import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

interface FavoriteServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const FavoriteServerCard: React.FC<FavoriteServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className="flex flex-row gap-[5px] items-center w-[calc(50%-2.5px)] p-[5px] cursor-pointer bg-background-secondary border border-border" onDoubleClick={handleServerDoubleClick}>
      <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={35} height={35} loading="lazy" draggable="false" />
      <div className="flex flex-1 flex-col justify-between min-h-[33px] overflow-hidden">
        <div className="flex items-center min-h-[1lh] overflow-hidden text-ellipsis text-text-color-quaternary whitespace-nowrap">{server.name}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`permission-${target.gender} permission-lv-${server.permissionLevel}`} />
          <div className="flex items-center min-w-[30px] min-h-[1lh] text-text-color-quaternary before:block before:min-w-[12px] before:min-h-[12px] before:mr-[2px] before:content-[''] before:bg-[url('/card/icon_contribu.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-auto">
            {server.contribution}
          </div>
        </div>
      </div>
    </div>
  );
});

FavoriteServerCard.displayName = 'FavoriteServerCard';

export default FavoriteServerCard;
