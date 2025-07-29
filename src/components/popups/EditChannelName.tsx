import React, { useEffect, useRef, useState } from 'react';

// Types
import { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface editChannelNamePopupProps {
  channelId: Channel['channelId'];
  serverId: Server['serverId'];
}

const editChannelNamePopup: React.FC<editChannelNamePopupProps> = React.memo(({ channelId, serverId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [channel, setChannel] = useState<Channel>(Default.channel());

  // Variables
  const { name: channelName } = channel;
  const canSubmit = channelName.trim();

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipcService.socket.send('editChannel', { serverId, channelId, update });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!channelId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.channel({ channelId: channelId }).then((channel) => {
        if (channel) setChannel(channel);
      });
    };
    refresh();
  }, [channelId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('channel-name-label')}</div>
              <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            if (!canSubmit) return;
            handleEditChannel(serverId, channelId, { name: channelName });
            handleClose();
          }}
        >
          {t('save')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

editChannelNamePopup.displayName = 'editChannelNamePopup';

export default editChannelNamePopup;
