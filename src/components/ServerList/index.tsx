import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ServerCard from './ServerCard';
import RecommendServerCard from './RecommendServerCard';

import styles from './ServerList.module.css';

interface ServerListProps {
  title: string;
  servers: (Types.Server | Types.RecommendServer)[];
}

const ServerList: React.FC<ServerListProps> = React.memo(({ title, servers }) => {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);

  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  const handleExpandBtnClick = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <div className={styles['server-list-title']}>{title}</div>
      <div className={styles['server-list-container']}>
        <div className={styles['server-list']}>
          {displayedServers.map((server) => ('online' in server ? <RecommendServerCard key={server.serverId} recommendServer={server} /> : <ServerCard key={server.serverId} server={server} />))}
        </div>
        {!canExpand ? null : expanded ? (
          <div className={styles['view-less-button']} onClick={handleExpandBtnClick}>
            {t('view-less')}
          </div>
        ) : (
          <div className={styles['view-more-button']} onClick={handleExpandBtnClick}>
            {t('view-more')}
          </div>
        )}
      </div>
    </>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
