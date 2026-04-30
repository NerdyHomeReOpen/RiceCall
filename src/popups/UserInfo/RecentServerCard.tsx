import React from 'react';
import { shallowEqual } from 'react-redux';
import Image from 'next/image';

import type * as Types from '@/types';

import { useAppSelector } from '@/hooks/Store';

import styles from './UserSetting.module.css';

interface RecentServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const RecentServerCard: React.FC<RecentServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const isSelf = user.userId === target.userId;
  const isOwned = server.ownerId === target.userId && server.owned;

  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['server-card']} onDoubleClick={handleServerDoubleClick}>
      <Image src={server.avatarUrl} alt="server_avatar" width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info']}>
        <div className={styles['server-name-text']}>{server.name}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div className={`${isSelf && isOwned ? styles['is-owner'] : ''}`} />
          <div className={styles['display-id-text']}>{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

RecentServerCard.displayName = 'RecentServerCard';

export default RecentServerCard;
