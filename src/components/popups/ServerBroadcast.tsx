import React, { useState } from 'react';

// Types
import { Server, Channel, Message } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import broadcast from '@/styles/popups/serverBroadcast.module.css';

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
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={broadcast['content']}>
          <div className={`${popup['inputGroup']}`}>
            <div className={`${popup['row']}`}>
              <div className={`${popup['label']} ${broadcast['label']}`}>{t('receiveChannel')}</div>
              <div className={broadcast['inputBox']}>
                <div className={`${popup['row']}`}>
                  <input
                    name="channelType"
                    type="radio"
                    checked={channelType === 'current'}
                    onChange={() => {
                      setChannelType('current');
                    }}
                  />
                  <div>
                    <div className={popup['label']}>{t('currentChannel')}</div>
                  </div>
                </div>
                <div className={`${popup['row']}`}>
                  <input
                    name="channelType"
                    type="radio"
                    checked={channelType === 'all'}
                    onChange={() => {
                      setChannelType('all');
                    }}
                  />
                  <div>
                    <div className={popup['label']}>{t('allChannel')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${popup['row']}`}>
              <div className={`${popup['label']} ${broadcast['label']}`}>{t('broadcast')}</div>
              <div className={broadcast['inputBox']}>
                <div className={`${popup['row']}`}>
                  <input
                    name="sendType"
                    type="radio"
                    checked={sendType === 'text'}
                    onChange={() => {
                      setSendType('text');
                    }}
                  />
                  <div>
                    <div className={popup['label']}>{t('textBroadcast')}</div>
                  </div>
                </div>
                <div className={`${popup['row']} ${popup['disabled']}`}>
                  <input
                    name="sendType"
                    type="radio"
                    checked={sendType === 'voice'}
                    onChange={() => {
                      setSendType('voice');
                    }}
                  />
                  <div>
                    <div className={popup['label']}>{`${t('voiceBroadcast')} ${t('soon')}`}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`${popup['inputGroup']} ${popup['row']}`}>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <div className={popup['label']}>{t('broadcastContent')}</div>
              <textarea
                name="content"
                maxLength={300}
                onChange={(e) => {
                  setBroadcastContent(e.target.value);
                }}
              />
              <div className={broadcast['labelArea']}>
                <div className={`${popup['label']} ${popup['disabled']}`}>{t('supportLink')}</div>
                <div className={broadcast['messageInputLength']}>
                  {broadcastContent.length}/{maxLength}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className={popup['popupFooter']}>
        <button
          className={popup['button']}
          disabled={!canSend}
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
        </button>
        <button type="button" className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
