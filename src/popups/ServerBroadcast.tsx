import React, { useMemo, useState } from 'react';

// Types
import type { Server, Channel, PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

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
  const canSend = useMemo(() => broadcastContent.trim() && broadcastContent.length <= MAX_LENGTH, [broadcastContent, MAX_LENGTH]);

  // Handlers
  const handleBroadcastChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], preset: Partial<PromptMessage>) => {
    ipc.socket.send('actionMessage', { serverId, channelId, preset });
    ipc.window.close();
  };

  const handleBroadcastServer = (serverId: Server['serverId'], preset: Partial<PromptMessage>) => {
    ipc.socket.send('actionMessage', { serverId, preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
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
            <textarea name="content" maxLength={MAX_LENGTH} style={{ minHeight: '90px' }} onChange={(e) => setBroadcastContent(e.target.value)} />
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
          onClick={() =>
            canSend
              ? broadcastType === 'channel'
                ? handleBroadcastChannel(serverId, channelId, { type: 'alert', content: broadcastContent })
                : handleBroadcastServer(serverId, { type: 'alert', content: broadcastContent })
              : null
          }
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
