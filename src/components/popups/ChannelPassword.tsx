import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, Channel } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ChannelPasswordPopupProps {
  userId: string;
  channelId: string;
  isSettingPassword: boolean;
  submitTo: string;
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(
  (initialData: ChannelPasswordPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Variables
    const { userId, channelId, isSettingPassword, submitTo } = initialData;
    console.log(initialData);

    // Refs
    const refreshRef = useRef(false);

    // States
    const [password, setPassword] = useState<string | null>(null);

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleJoinChannel = (
      userId: User['id'],
      channelId: Channel['id'],
      password: string | null,
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, password });
    };

    const handleUpdateChannel = (password: string | null) => {
      if (!socket) return;
      ipcService.popup.submit(submitTo, password);
    };

    const handleChannelUpdate = (data: Channel | null) => {
      if (!data) data = createDefault.channel();
      setPassword(data.password);
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
        ]).then(([channel]) => {
          handleChannelUpdate(channel);
        });
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
                  {isSettingPassword
                    ? lang.tr.setChannelPasswordDescription
                    : lang.tr.pleaseEnterTheChannelPassword}
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
              if (isSettingPassword) {
                console.log(password);
                handleUpdateChannel(password);
              } else {
                handleJoinChannel(userId, channelId, password);
              }
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
