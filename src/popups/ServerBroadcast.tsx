import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { MAX_BROADCAST_LENGTH } from '@/constant';

import popupStyles from '@/styles/popup.module.css';

interface ServerBroadcastPopupProps {
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
}

const ServerBroadcastPopup: React.FC<ServerBroadcastPopupProps> = React.memo(({ serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [sendType, setSendType] = useState<'text' | 'voice'>('text');
  const [broadcastType, setBroadcastType] = useState<'channel' | 'server'>('channel');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  // Variables
  const canSend = broadcastContent.trim() && broadcastContent.length <= MAX_BROADCAST_LENGTH;

  // Handlers
  const handleBroadcastChannel = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], preset: Partial<Types.PromptMessage>) => {
    ipc.socket.send('actionMessage', { serverId, channelId, preset });
    ipc.window.close();
  };

  const handleBroadcastServer = (serverId: Types.Server['serverId'], preset: Partial<Types.PromptMessage>) => {
    ipc.socket.send('actionMessage', { serverId, preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['row']}>
            <div className={popupStyles['label']}>{t('receive-channel')}</div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'channel'} onChange={() => setBroadcastType('channel')} />
              <div className={popupStyles['label']}>{t('current-channel')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'server'} onChange={() => setBroadcastType('server')} />
              <div className={popupStyles['label']}>{t('all-channel')}</div>
            </div>
          </div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['label']}>{t('broadcast-type')}</div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'text'} onChange={() => setSendType('text')} />
              <div className={popupStyles['label']}>{t('text-broadcast')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${'disabled'}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'voice'} onChange={() => setSendType('voice')} />
              <div className={popupStyles['label']}>{`${t('voice-broadcast')} ${t('soon')}`}</div>
            </div>
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('broadcast-content')}</div>
            <textarea name="content" maxLength={MAX_BROADCAST_LENGTH} style={{ minHeight: '90px' }} onChange={(e) => setBroadcastContent(e.target.value)} />
            <div className={popupStyles['hint-text']}>
              {broadcastContent.length}/{MAX_BROADCAST_LENGTH}
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div
          className={`${popupStyles['button']} ${!canSend ? 'disabled' : ''}`}
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
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
