import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Default from '@/utils/default';

import styles from '@/styles/actionLink.module.css';

interface JoinServerLinkProps {
  serverId: string;
  displayId: string;
  content: string;
}

export const JoinServerLink: React.FC<JoinServerLinkProps> = React.memo(({ serverId, displayId, content }) => {
  const [targetServerId, setTargetServerId] = useState<Types.Server['serverId']>(serverId);

  const handleJoinServer = () => {
    if (serverId === '') return;
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: displayId, serverId: targetServerId, timestamp: Date.now() }));
  };

  useEffect(() => {
    if (serverId) return;
    const refresh = async () => {
      ipc.data.searchServer({ query: displayId }).then((server) => {
        if (server) setTargetServerId(server[0].serverId);
      });
    };
    refresh();
  }, [serverId, displayId]);

  return (
    <span className={styles['actionLink']} onClick={handleJoinServer}>
      {content}
    </span>
  );
});

JoinServerLink.displayName = 'JoinServerLink';

interface InviteServerProps {
  displayId: string;
}

export const InviteServer: React.FC<InviteServerProps> = React.memo(({ displayId }) => {
  const { t } = useTranslation();

  const [server, setServer] = useState<Types.Server>(Default.server());

  const formatedContent = t('server-invitation-content').split('<server>');

  useEffect(() => {
    if (!displayId) return;
    const refresh = async () => {
      ipc.data.searchServer({ query: displayId }).then((server) => {
        if (server) setServer(server[0]);
      });
    };
    refresh();
  }, [displayId]);

  return (
    <div className={styles['invitation-container']}>
      <div className={styles['invitation-headers']}>
        <div className={styles['icon']} />
        <div className={styles['title']}>{t('join-server-invitation')}</div>
      </div>
      <div className={styles['invitation-contents']}>
        {formatedContent[0]} <span className={styles['server-name']}>{server.name}</span>
        {formatedContent[1]}
        <JoinServerLink serverId={server.serverId} displayId={server.specialId || server.displayId} content={'進入...'} />
      </div>
    </div>
  );
});

InviteServer.displayName = 'InviteServer';

interface ActionLinkProps {
  type: 'joinServer' | 'invitation';
  data: string;
  content: string;
}

const ActionLink: React.FC<ActionLinkProps> = React.memo(({ type, data, content }) => {
  const joinServerRegex = /^https?:\/\/ricecall\.com\/join(?:\?|$)/;
  const result = joinServerRegex.test(data);

  if (!result) return <span>{data}</span>;

  const displayId = new URL(data).searchParams.get('sid');

  if (!displayId) return <span>{data}</span>;

  switch (type) {
    case 'joinServer':
      return <JoinServerLink serverId={''} displayId={displayId} content={content} />;
    case 'invitation':
      return <InviteServer displayId={displayId} />;
    default:
      return <span>{data}</span>;
  }
});

ActionLink.displayName = 'ActionLink';

export default ActionLink;
