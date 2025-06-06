import React, { useEffect, useRef, useState } from 'react';

// Types
import { Channel, Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface editChannelNamePopupProps {
  channelId: Channel['channelId'];
  serverId: Server['serverId'];
}

const editChannelNamePopup: React.FC<editChannelNamePopupProps> = React.memo(
  ({ channelId, serverId }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [channel, setChannel] = useState<Channel>(createDefault.channel());

    // Variables
    const { name: channelName } = channel;
    const canSubmit = channelName.trim();

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
          if (channel) {
            setChannel(channel);
          }
        });
      };
      refresh();
    }, [channelId]);

    return (
      <div className={popup['popupContainer']}>
        {/* Body */}
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{lang.tr.channelNameLabel}</div>
                <input
                  name="name"
                  type="text"
                  value={channelName}
                  maxLength={32}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              handleUpdateChannel({ name: channelName }, channelId, serverId);
              handleClose();
            }}
          >
            {lang.tr.save}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

editChannelNamePopup.displayName = 'editChannelNamePopup';

export default editChannelNamePopup;
