import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ServerCard from '@/components/ServerCard';

import styles from '@/styles/Home.module.css';

interface ServerListProps {
  title: string;
  servers: Types.Server[];
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
      <div className={styles['servers-container']}>
        <div className={styles['server-list']}>
          {displayedServers.map((server) => (
            <ServerCard key={server.serverId} server={server} />
          ))}
        </div>
        {!canExpand ? null : expanded ? (
          <div className={`${styles['view-more-btn']} ${styles['more-icon']}`} onClick={handleExpandBtnClick}>
            {t('view-less')}
          </div>
        ) : (
          <div className={`${styles['view-more-btn']} ${styles['less-icon']}`} onClick={handleExpandBtnClick}>
            {t('view-more')}
          </div>
        )}
      </div>
    </>
  );
});

ServerList.displayName = 'ServerList';

export default ServerList;
