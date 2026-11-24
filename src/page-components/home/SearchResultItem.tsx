import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

interface SearchResultItemProps {
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onServerSelect }) => {
  const handleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className="flex items-center h-[50px] px-[10px] py-[5px] cursor-pointer hover:bg-hover" onClick={handleClick}>
      <div className="w-[40px] h-[40px]">
        <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-1 flex-col justify-around w-full h-full ml-[10px] truncate">
        <div className="text-text-color-quaternary">{server.name}</div>
        <div className="flex items-center text-text-color-quaternary">
          <div className="min-w-[12px] min-h-[12px] mr-[5px] bg-[url('/channel/ID.svg')] bg-no-repeat bg-position-[0_0]" />
          <div className="truncate">{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;
