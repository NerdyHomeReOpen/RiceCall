import React, { useState } from 'react';

// Types
import { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelPasswordPopupProps {
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [password, setPassword] = useState<string>('');

  // Handlers
  const handleJoinChannel = (channelId: Channel['channelId'], serverId: Server['serverId'], password: string) => {
    ipcService.socket.send('connectChannel', { channelId, serverId, password });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-enter-the-channel-password')}</div>
            <input
              type="text"
              value={password || ''}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') setPassword('');
                else setPassword(value);
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${password && password.length <= 4 ? '' : 'disabled'}`}
          onClick={() => {
            handleJoinChannel(channelId, serverId, password);
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

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
