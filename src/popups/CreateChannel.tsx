import React, { useMemo, useState } from 'react';

// Types
import type { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface CreateChannelPopupProps {
  serverId: Server['serverId'];
  parent: Channel | null;
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ serverId, parent: parentData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channel, setChannel] = useState<Channel>(Default.channel());

  // Destructuring
  const { name: channelName } = channel;
  const { channelId: parentChannelId, name: parentChannelName } = parentData || {};

  // Memos
  const canSubmit = useMemo(() => channelName.trim(), [channelName]);

  // Handlers
  const handleCreateChannel = (serverId: Server['serverId'], preset: Partial<Channel>) => {
    ipc.socket.send('createChannel', { serverId, preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['dialog-content']} ${popup['col']}`}>
          <div className={popup['input-box']}>
            <div className={popup['label']}>{t('parent-channel')}</div>
            <div className={popup['label']}>{parentChannelName || t('none')}</div>
          </div>
          <div className={popup['input-box']}>
            <div className={popup['label']}>{t('channel-name')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannel({ ...channel, name: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => (canSubmit ? handleCreateChannel(serverId, { name: channelName, categoryId: parentChannelId || null }) : null)}
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
