import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/types';

import { useAppSelector } from '@/hooks/useStore';

import ServerList from './ServerList';

import styles from './home.module.css';

const HomePagePersonalExclusive: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const servers = useAppSelector((state) => state.servers.data, shallowEqual);

  const recentServers = useMemo(() => servers.filter((s) => s.isRecent).sort((a, b) => b.lastConnectedAt - a.lastConnectedAt), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.isFavorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > Permission.Guest), [servers]);

  return (
    <>
      <div className={styles['wrapper']}>
        <ServerList title={t('recent-servers')} servers={recentServers} />
        <ServerList title={t('my-servers')} servers={ownedServers} />
        <ServerList title={t('favorited-servers')} servers={favoriteServers} />
      </div>
    </>
  );
});

HomePagePersonalExclusive.displayName = 'HomePagePersonalExclusive';

export default HomePagePersonalExclusive;
