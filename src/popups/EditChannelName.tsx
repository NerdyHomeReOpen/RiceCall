import React, { useMemo, useState } from 'react';

// Types
import type { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface EditChannelNamePopupProps {
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
  channel: Channel;
}

const EditChannelNamePopup: React.FC<EditChannelNamePopupProps> = React.memo(({ serverId, channelId, channel }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channelName, setChannelName] = useState<string>(channel.name);

  // Memos
  const canSubmit = useMemo(() => channelName.trim(), [channelName]);

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('channel-name-label')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannelName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleEditChannel(serverId, channelId, { name: channelName }) : null)}>
          {t('save')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelNamePopup.displayName = 'EditChannelNamePopup';

export default EditChannelNamePopup;
