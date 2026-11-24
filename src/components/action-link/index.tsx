import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { getDefaultServer } from '@/utils/default';

interface ActionLinkProps {
  href: string;
}

const ActionLink: React.FC<ActionLinkProps> = React.memo(({ href }) => {
  const { t } = useTranslation();
  const [server, setServer] = useState<Types.Server>(getDefaultServer());
  const displayId = new URL(href).searchParams.get('serverDisplayId') || '';

  const handleLinkClick = () => {
    ipc.server.select({ serverDisplayId: displayId, serverId: server.serverId, timestamp: Date.now() });
  };

  useEffect(() => {
    if (!displayId) return;

    const refresh = async () => {
      ipc.api.searchServer({ query: displayId }).then((server) => {
        if (server) setServer(server[0]);
      });
    };

    refresh();
  }, [displayId]);

  if (!displayId) return <span>{href}</span>;

  return (
    <span className="relative flex flex-col p-[5px] bg-white border border-[#ccc] rounded-[10px] shadow-[0_0_5px_1px_rgb(0_0_0/10%)]">
      <span className="flex flex-row items-center justify-start">
        <span className="w-[15px] h-[15px] bg-[url('/im/invitenotify.svg')] bg-no-repeat bg-center bg-contain" />
        <span className="ml-[5px] text-[14px] text-[#999]">{t('join-server-invitation')}</span>
      </span>
      <span className="px-[25px] py-[10px]">
        {t('server-invitation-content.prefix')}
        <span className="text-text-link">{server.name}</span>
        {t('server-invitation-content.suffix')}
        <span className="font-bold text-text-link cursor-pointer hover:text-[#013880]" onClick={handleLinkClick}>
          {t('join-server')}
        </span>
      </span>
    </span>
  );
});

ActionLink.displayName = 'ActionLink';

export default ActionLink;
