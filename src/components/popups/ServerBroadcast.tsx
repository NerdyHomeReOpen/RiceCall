import React, { useState } from 'react';

// Types
import { Server, Channel, Message } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
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

const ServerBroadcastPopup: React.FC<ServerBroadcastPopupProps> = React.memo(
  ({ serverId, channelId }) => {
    // Hooks
    const lang = useLanguage();
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
                <div className={`${popup['label']} ${broadcast['label']}`}>
                  {'接收頻道' /* TODO: lang.tr */}
                </div>
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
                      <div className={popup['label']}>
                        {'當前頻道' /* TODO: lang.tr */}
                      </div>
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
                      <div className={popup['label']}>
                        {'所有頻道' /* TODO: lang.tr */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${popup['row']}`}>
                <div className={`${popup['label']} ${broadcast['label']}`}>
                  {'廣播' /* TODO: lang.tr */}
                </div>
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
                      <div className={popup['label']}>
                        {'文字廣播' /* TODO: lang.tr */}
                      </div>
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
                      <div className={popup['label']}>{`${
                        '語音廣播' /* TODO: lang.tr */
                      } ${lang.tr.soon}`}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${popup['inputGroup']} ${popup['row']}`}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {'廣播內容' /* TODO: lang.tr */}
                </div>
                <textarea
                  name="content"
                  maxLength={300}
                  onChange={(e) => {
                    setBroadcastContent(e.target.value);
                  }}
                />
                <div className={broadcast['labelArea']}>
                  <div className={`${popup['label']} ${popup['disabled']}`}>
                    {'支援連結，不超過300字' /* TODO: lang.tr */}
                  </div>
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
            {lang.tr.confirm}
          </button>
          <button
            type="button"
            className={popup['button']}
            onClick={() => handleClose()}
          >
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
