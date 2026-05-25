import React from 'react';
import Image from 'next/image';

import * as Types from '@/types';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

import styles from './Home.module.css';

interface SearchResultItemProps {
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onServerSelect }) => {
  const handleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['dropdown-item']} onClick={handleClick}>
      <div className={styles['dropdown-item-avatar']}>
        <Image src={server.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['dropdown-item-info-text']}>
        <div className={styles['dropdown-item-name-text']}>{server.name}</div>
        <div className={styles['dropdown-item-id']}>
          <div className={styles['dropdown-item-id-icon']} />
          <div className={styles['dropdown-item-id-text']}>{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export default SearchResultItem;
