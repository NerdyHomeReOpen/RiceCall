import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ServerCard from '@/components/ServerCard';

import homeStyles from '@/styles/home.module.css';

interface ServerListProps {
  title: string;
  servers: Types.Server[];
}

const ServerList: React.FC<ServerListProps> = React.memo(({ title, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [expanded, setExpanded] = useState(false);

  // Variables
  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  // Handlers
  const handleExpandBtnClick = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <div className={homeStyles['server-list-title']}>{title}</div>
      <div className={homeStyles['servers-container']}>
        <div className={homeStyles['server-list']}>
          {displayedServers.map((server) => (
            <ServerCard key={server.serverId} server={server} />
          ))}
        </div>
        {!canExpand ? null : expanded ? (
          <div className={`${homeStyles['view-more-btn']} ${homeStyles['more-icon']}`} onClick={handleExpandBtnClick}>
            {t('view-less')}
          </div>
        ) : (
          <div className={`${homeStyles['view-more-btn']} ${homeStyles['less-icon']}`} onClick={handleExpandBtnClick}>
            {t('view-more')}
          </div>
        )}
      </div>
    </>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
