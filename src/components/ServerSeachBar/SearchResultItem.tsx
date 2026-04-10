import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from '@/pages/Home/Home.module.css';

interface SearchResultItemProps {
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onServerSelect }) => {
  const handleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['item']} onClick={handleClick}>
      <Image className={styles['search-server-avatar-picture']} src={server.avatarUrl} alt={server.name} width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['search-server-info-text']}>
        <div className={styles['search-server-name-text']}>{server.name}</div>
        <div className={styles['search-server-id-box']}>
          <div className={styles['search-server-id-icon']} />
          <div className={styles['search-server-id-text']}>{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;
