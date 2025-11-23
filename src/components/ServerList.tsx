import React, { useState } from 'react';

// CSS
import homePage from '@/styles/home.module.css';

// Types
import type { Server, User } from '@/types';

// Components
import ServerCard from '@/components/ServerCard';

// Providers
import { useTranslation } from 'react-i18next';

interface ServerListProps {
  title: string;
  user: User;
  servers: Server[];
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
    <div>
      <div className={homePage['server-list-title']}>{title}</div>
      <div className={homePage['server-list']}>
        {displayedServers.map((server) => (
          <ServerCard key={server.serverId} user={user} server={server} />
        ))}
      </div>
      {canExpand && (
        <div className={`${homePage['view-more-btn']} ${expanded ? homePage['more-icon'] : homePage['less-icon']}`} onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? t('view-less') : t('view-more')}
        </div>
      )}
    </div>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
