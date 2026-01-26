import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Default from '@/utils/default';
import { platformStorage } from '@/platform/storage';

import styles from '@/styles/actionLink.module.css';

interface ActionLinkProps {
  href: string;
}

const ActionLink: React.FC<ActionLinkProps> = React.memo(({ href }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [server, setServer] = useState<Types.Server>(Default.server());

  // Variables
  const displayId = new URL(href).searchParams.get('sid');

  // Handlers
  const handleLinkClick = () => {
    platformStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: displayId, serverId: server.serverId, timestamp: Date.now() }));
  };

  // Effects
  useEffect(() => {
    if (!displayId) return;
    const refresh = async () => {
      ipc.data.searchServer({ query: displayId }).then((server) => {
        if (server) setServer(server[0]);
      });
    };
    refresh();
  }, [displayId]);

  if (!displayId) return <span>{href}</span>;
  return (
    <span className={styles['invitation-container']}>
      <span className={styles['invitation-headers']}>
        <span className={styles['icon']} />
        <span className={styles['title']}>{t('join-server-invitation')}</span>
      </span>
      <span className={styles['invitation-contents']}>
        {t('server-invitation-content.prefix')}
        <span className={styles['server-name']}>{server.name}</span>
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
