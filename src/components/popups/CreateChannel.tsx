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

interface CreateChannelPopupProps {
  channelId: Channel['channelId'] | null;
  serverId: Server['serverId'];
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ channelId, serverId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [parent, setParent] = useState<Channel>(Default.channel());
  const [channel, setChannel] = useState<Channel>(Default.channel());

  // Variables
  const { name: parentName } = parent;
  const { name: channelName } = channel;
  const canCreate = channelName.trim();

  const handleCreateChannel = (serverId: Server['serverId'], preset: Partial<Channel>) => {
    ipcService.socket.send('createChannel', { serverId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!channelId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.channel({ channelId: channelId }).then((parent) => {
        if (parent) setParent(parent);
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
            <div className={popup['input-box']}>
              <div className={popup['label']}>{t('parent-channel')}</div>
              <div className={popup['label']}>{parentName || t('none')}</div>
            </div>
            <div className={popup['input-box']}>
              <div className={popup['label']}>{t('channel-name')}</div>
              <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canCreate ? 'disabled' : ''}`}
          onClick={() => {
            handleCreateChannel(serverId, { name: channelName, categoryId: channelId });
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

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
