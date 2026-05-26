import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import styles from './ActionLink.module.css';

interface ActionLinkProps {
  href: string;
}

const ActionLink: React.FC<ActionLinkProps> = React.memo(({ href }) => {
  const { t } = useTranslation();

  const [server, setServer] = useState<Types.Server | undefined>(undefined);

  const serverDisplayId = new URL(href).searchParams.get('sid') || '';

  const handleLinkClick = () => {
    if (!server) return;
    ipc.server.select({ serverDisplayId, serverId: server.serverId, timestamp: Date.now() });
  };

  useEffect(() => {
    if (!serverDisplayId) return;

    const refresh = async () => {
      ipc.api.searchServer({ query: serverDisplayId }).then((server) => {
        if (server.length === 0) return;
        setServer(server[0]);
      });
    };

    refresh();
  }, [serverDisplayId]);

  if (!serverDisplayId) return <span>{href}</span>;

  return (
    <span className={styles['invitation-container']}>
      <span className={styles['invitation-header']}>
        <span className={styles['icon']} />
        <span className={styles['title']}>{t('join-server-invitation')}</span>
      </span>
      <span className={styles['invitation-content']}>
        {t('server-invitation-content.prefix')}
        <span className={styles['server-name']}>{server?.name || t('loading')}</span>
        {t('server-invitation-content.suffix')}
        <span className={styles['action-link']} onClick={handleLinkClick}>
          {t('join-server')}
        </span>
      </span>
    </span>
  );
});

ActionLink.displayName = 'ActionLink';

export default ActionLink;
