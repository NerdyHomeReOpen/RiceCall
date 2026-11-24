import React from 'react';
import { shallowEqual } from 'react-redux';
import Image from 'next/image';

import type * as Types from '@/types';

import { useAppSelector } from '@/hooks/useStore';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

interface RecentServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const RecentServerCard: React.FC<RecentServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const isSelf = user.userId === target.userId;
  const isOwned = server.ownerId === target.userId && server.isOwned;

  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className="flex flex-row gap-[5px] items-center w-[calc(50%-2.5px)] p-[5px] cursor-pointer bg-background-secondary border border-border" onDoubleClick={handleServerDoubleClick}>
      <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={35} height={35} loading="lazy" draggable="false" />
      <div className="flex flex-1 flex-col justify-between min-h-[33px] overflow-hidden">
        <div className="flex items-center min-h-[1lh] overflow-hidden text-ellipsis text-text-color-quaternary whitespace-nowrap">{server.name}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div
            className={`${isSelf && isOwned ? "before:block before:w-[13px] before:h-[15px] before:mr-[5px] before:content-[''] before:bg-[url('/icon_creator.svg')] before:bg-position-[0_0] before:bg-contain" : ''}`}
          />
          <div className="flex items-center min-h-[1lh] text-text-color-quaternary before:block before:w-[12px] before:h-[12px] before:mr-[2px] before:content-[''] before:bg-[url('/card/icon_id.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-contain">
            {server.specialId || server.displayId}
          </div>
        </div>
      </div>
    </div>
  );
});

RecentServerCard.displayName = 'RecentServerCard';

export default RecentServerCard;
