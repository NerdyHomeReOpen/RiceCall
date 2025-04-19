import React, { useState } from 'react';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';
import { Channel, Server } from '@/types';

interface editChannelNamePopupProps {
  channelId: string;
  serverId: string;
  name: string;
}

const editChannelNamePopup: React.FC<editChannelNamePopupProps> = React.memo(
  (initialData: editChannelNamePopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [newChannelName, setNewChannelName] = useState<string>(
      initialData.name,
    );

    // Variables
    const { channelId, serverId } = initialData;

    // Handlers
    const handleUpdateChannel = (
      channel: Partial<Channel>,
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateChannel({ channel, channelId, serverId });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    return (
      <form className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{lang.tr.channelNameLabel}</div>
                <input
                  className={popup['input']}
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !newChannelName.trim() ? popup['disabled'] : ''
            }`}
            onClick={() => {
              handleUpdateChannel(
                {
                  name: newChannelName,
                },
                channelId,
                serverId,
              );
              handleClose();
            }}
          >
            {lang.tr.save}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </form>
    );
  },
);

editChannelNamePopup.displayName = 'editChannelNamePopup';

export default editChannelNamePopup;
