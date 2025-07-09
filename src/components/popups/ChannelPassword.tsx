import React, { useState } from 'react';

// Types
import { User, Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelPasswordPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ userId, serverId, channelId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // States
  const [password, setPassword] = useState<string | null>(null);

  // Handlers
  const handleJoinChannel = (
    userId: User['userId'],
    channelId: Channel['channelId'],
    serverId: Server['serverId'],
    password: string | null,
  ) => {
    if (!socket) return;
    socket.send.connectChannel({ userId, channelId, serverId, password });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={`${popup['inputBox']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-enter-the-channel-password')}</div>
            <input
              type="text"
              value={password || ''}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') setPassword(null);
                else setPassword(value);
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div
          className={`${popup['button']} ${password && password.length <= 4 ? '' : popup['disabled']}`}
          onClick={() => {
            handleJoinChannel(userId, channelId, serverId, password);
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
