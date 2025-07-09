import React, { useState } from 'react';

// Types
import { Server, Channel, Message } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

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
  const socket = useSocket();

  // States
  const [channelType, setChannelType] = useState<string>('current');
  const [sendType, setSendType] = useState<string>('text');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  // Variables
  const maxLength = 300;
  const canSend = broadcastContent.trim();

  // Handlers
  const handleBroadcastServer = (
    message: Partial<Message>,
    serverId: Server['serverId'],
    channelId: Channel['channelId'] | null,
  ) => {
    socket.send.actionMessage({ message, serverId, channelId });
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
              <input
                name="channelType"
                type="radio"
                checked={channelType === 'current'}
                onChange={() => {
                  setChannelType('current');
                }}
              />
              <div className={popup['label']}>{t('current-channel')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
              <input
                name="channelType"
                type="radio"
                checked={channelType === 'all'}
                onChange={() => {
                  setChannelType('all');
                }}
              />
              <div className={popup['label']}>{t('all-channel')}</div>
            </div>
          </div>
          <div className={popup['row']}>
            <div className={popup['label']}>{t('broadcast-type')}</div>
            <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
              <input
                name="sendType"
                type="radio"
                checked={sendType === 'text'}
                onChange={() => {
                  setSendType('text');
                }}
              />
              <div className={popup['label']}>{t('text-broadcast')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`} style={{ width: 'fit-content' }}>
              <input
                name="sendType"
                type="radio"
                checked={sendType === 'voice'}
                onChange={() => {
                  setSendType('voice');
                }}
              />
              <div className={popup['label']}>{`${t('voice-broadcast')} ${t('soon')}`}</div>
            </div>
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('broadcast-content')}</div>
            <textarea
              name="content"
              maxLength={300}
              placeholder={t('markdown-support')}
              style={{ minHeight: '90px' }}
              onChange={(e) => {
                setBroadcastContent(e.target.value);
              }}
            />
            <div className={popup['hint-text']}>
              {broadcastContent.length}/{maxLength}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSend ? 'disabled' : ''}`}
          onClick={() => {
            handleBroadcastServer(
              { type: 'alert', content: broadcastContent },
              serverId,
              channelType === 'current' ? channelId : null,
            );
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
