import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './UserSetting.module.css';

interface FavoriteServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const FavoriteServerCard: React.FC<FavoriteServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['server-card']} onDoubleClick={handleServerDoubleClick}>
      <Image src={server.avatarUrl} alt="server_avatar" width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info']}>
        <div className={styles['server-name-text']}>{server.name}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`permission-${target.gender} permission-lv-${server.permissionLevel}`} />
          <div className={styles['contribution-value-text']}>{server.contribution}</div>
        </div>
      </div>
    </div>
  );
});

FavoriteServerCard.displayName = 'FavoriteServerCard';

export default FavoriteServerCard;
