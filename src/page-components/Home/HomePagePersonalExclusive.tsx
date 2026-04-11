import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/Store';

import ServerList from '@/components/ServerList';

import styles from './Home.module.css';

const HomePagePersonalExclusive: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const servers = useAppSelector((state) => state.servers.data, shallowEqual);

  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);

  return (
    <>
      <div className={styles['home-wrapper']}>
        <ServerList title={t('recent-servers')} servers={recentServers} />
        <ServerList title={t('my-servers')} servers={ownedServers} />
        <ServerList title={t('favorited-servers')} servers={favoriteServers} />
      </div>
    </>
  );
});

HomePagePersonalExclusive.displayName = 'HomePagePersonalExclusive';

export default HomePagePersonalExclusive;
