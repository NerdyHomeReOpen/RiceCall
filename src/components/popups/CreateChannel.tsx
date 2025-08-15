import React, { useState } from 'react';

// Types
import type { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface CreateChannelPopupProps {
  serverId: Server['serverId'];
  categoryId: Channel['channelId'] | null;
  categoryName: Channel['name'];
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ serverId, categoryId, categoryName }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channelName, setChannelName] = useState<Channel['name']>('');

  // Variables
  const canSubmit = channelName.trim();

  const handleCreateChannel = (serverId: Server['serverId'], preset: Partial<Channel>) => {
    ipcService.socket.send('createChannel', { serverId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={popup['input-box']}>
              <div className={popup['label']}>{t('parent-channel')}</div>
              <div className={popup['label']}>{categoryName || t('none')}</div>
            </div>
            <div className={popup['input-box']}>
              <div className={popup['label']}>{t('channel-name')}</div>
              <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannelName(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleCreateChannel(serverId, { name: channelName, categoryId });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
