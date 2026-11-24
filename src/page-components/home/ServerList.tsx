import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ServerCard from './ServerCard';
import RecommendServerCard from './RecommendServerCard';

interface ServerListProps {
  title: string;
  servers: (Types.Server | Types.RecommendServer)[];
}

const ServerList: React.FC<ServerListProps> = React.memo(({ title, servers }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedServers = isExpanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  const handleExpandBtnClick = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      <div className="p-[10px] mx-auto my-[10px] text-[1.5em] font-bold border-b-2 border-b-border">{title}</div>
      <div className="flex flex-col place-items-center w-full p-[10px] bg-background-secondary">
        <div className="flex flex-wrap gap-[10px] justify-start w-[830px] [@media(width<=900px)]:w-[550px]">
          {displayedServers.map((server) => ('online' in server ? <RecommendServerCard key={server.serverId} recommendServer={server} /> : <ServerCard key={server.serverId} server={server} />))}
        </div>
        {canExpand &&
          (isExpanded ? (
            <div
              className="relative flex gap-[5px] items-center justify-center w-fit p-[5px] mt-[8px] mx-auto mb-[16px] cursor-pointer bg-background border border-border rounded-[5px] hover:bg-hover before:inline-block before:min-w-[16px] before:min-h-[16px] before:content-[''] before:bg-[url('/btn_fold_person.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-auto before:transform-[rotate(180deg)] hover:before:bg-position-[-16px_0] active:before:bg-position-[-32px_0]"
              onClick={handleExpandBtnClick}
            >
              {t('view-less')}
            </div>
          ) : (
            <div
              className="relative flex gap-[5px] items-center justify-center w-fit p-[5px] mt-[8px] mx-auto mb-[16px] cursor-pointer bg-background border border-border rounded-[5px] hover:bg-hover before:inline-block before:min-w-[16px] before:min-h-[16px] before:content-[''] before:bg-[url('/btn_fold_person.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-auto hover:before:bg-position-[-16px_0] active:before:bg-position-[-32px_0]"
              onClick={handleExpandBtnClick}
            >
              {t('view-more')}
            </div>
          ))}
      </div>
    </>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
