import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './ServerSearchBar.module.css';

interface SearchResultItemProps {
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onServerSelect }) => {
  const handleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['server-search-dropdown-item']} onClick={handleClick}>
      <div className={styles['server-search-dropdown-item-avatar-picture']}>
        <Image src={server.avatarUrl} alt="server_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['server-search-dropdown-item-info-text']}>
        <div className={styles['server-search-dropdown-item-name-text']}>{server.name}</div>
        <div className={styles['server-search-dropdown-item-id-box']}>
          <div className={styles['server-search-dropdown-item-id-icon']} />
          <div className={styles['server-search-dropdown-item-id-text']}>{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;
