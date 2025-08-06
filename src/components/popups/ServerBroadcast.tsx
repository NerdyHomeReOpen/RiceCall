import React, { useMemo, useState } from 'react';

// Types
import type { Server, Channel, PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface ServerBroadcastPopupProps {
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ServerBroadcastPopup: React.FC<ServerBroadcastPopupProps> = React.memo(({ serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [sendType, setSendType] = useState<'text' | 'voice'>('text');
  const [broadcastType, setBroadcastType] = useState<'channel' | 'server'>('channel');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  // Memos
  const MAX_LENGTH = useMemo(() => 300, []);

  // Variables
  const canSend = broadcastContent.trim();

  // Handlers
  const handleBroadcastServer = (serverId: Server['serverId'], channelId: Channel['channelId'] | undefined, preset: Partial<PromptMessage>) => {
    ipcService.socket.send('actionMessage', { serverId, channelId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['row']}>
            <div className={popup['label']}>{t('receive-channel')}</div>
            <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'channel'} onChange={() => setBroadcastType('channel')} />
              <div className={popup['label']}>{t('current-channel')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'server'} onChange={() => setBroadcastType('server')} />
              <div className={popup['label']}>{t('all-channel')}</div>
            </div>
          </div>
          <div className={popup['row']}>
            <div className={popup['label']}>{t('broadcast-type')}</div>
            <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'text'} onChange={() => setSendType('text')} />
              <div className={popup['label']}>{t('text-broadcast')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'voice'} onChange={() => setSendType('voice')} />
              <div className={popup['label']}>{`${t('voice-broadcast')} ${t('soon')}`}</div>
            </div>
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('broadcast-content')}</div>
            <textarea name="content" maxLength={MAX_LENGTH} placeholder={t('markdown-support')} style={{ minHeight: '90px' }} onChange={(e) => setBroadcastContent(e.target.value)} />
            <div className={popup['hint-text']}>
              {broadcastContent.length}/{MAX_LENGTH}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSend ? 'disabled' : ''}`}
          onClick={() => {
            handleBroadcastServer(serverId, broadcastType === 'channel' ? channelId : undefined, { type: 'alert', content: broadcastContent });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
