import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, Channel, Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

interface ChannelPasswordPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(
  (initialData: ChannelPasswordPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Variables
    const { userId, serverId, channelId } = initialData;

    // Refs
    const refreshRef = useRef(false);

    // States
    const [password, setPassword] = useState<string | null>(null);

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleJoinChannel = (
      userId: User['userId'],
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
      password: string | null,
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId, password });
    };

    // Effects
    useEffect(() => {
      if (!channelId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.channel({
            channelId: channelId,
          }),
        ]);
      };
      refresh();
    }, [channelId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseEnterTheChannelPassword}
                </div>
                <input
                  className={popup['input']}
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
        </div>
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              password && password.length <= 4 ? '' : popup['disabled']
            }`}
            onClick={() => {
              handleJoinChannel(userId, channelId, serverId, password);
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
