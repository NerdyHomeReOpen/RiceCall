import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ServerCard from '@/components/ServerCard';

import homeStyles from '@/styles/home.module.css';

interface ServerListProps {
  title: string;
  user: Types.User;
  servers: Types.Server[];
}

const ServerList: React.FC<ServerListProps> = React.memo(({ title, user, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [expanded, setExpanded] = useState(false);

  // Variables
  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  return (
    <>
      <div className={homeStyles['server-list-title']}>{title}</div>
      <div className={homeStyles['servers-container']}>
        <div className={homeStyles['server-list']}>
          {displayedServers.map((server) => (
            <ServerCard key={server.serverId} user={user} server={server} />
          ))}
        </div>
        {canExpand && (
          <div className={`${homeStyles['view-more-btn']} ${expanded ? homeStyles['more-icon'] : homeStyles['less-icon']}`} onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? t('view-less') : t('view-more')}
          </div>
        )}
      </div>
    </>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
