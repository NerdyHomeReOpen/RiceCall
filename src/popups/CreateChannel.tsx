import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Default from '@/utils/default';

import popupStyles from '@/styles/popup.module.css';

interface CreateChannelPopupProps {
  serverId: Types.Server['serverId'];
  parent: Types.Channel | null;
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ serverId, parent: parentData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channel, setChannel] = useState<Types.Channel>(Default.channel());

  // Variables
  const { name: channelName } = channel;
  const { channelId: parentChannelId, name: parentChannelName } = parentData || {};
  const canSubmit = channelName.trim();

  // Handlers
  const handleCreateChannel = (serverId: Types.Server['serverId'], preset: Partial<Types.Channel>) => {
    ipc.socket.send('createChannel', { serverId, preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={popupStyles['input-box']}>
            <div className={popupStyles['label']}>{t('parent-channel')}</div>
            <div className={popupStyles['label']}>{parentChannelName || t('none')}</div>
          </div>
          <div className={popupStyles['input-box']}>
            <div className={popupStyles['label']}>{t('channel-name')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannel({ ...channel, name: e.target.value })} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div
          className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => (canSubmit ? handleCreateChannel(serverId, { name: channelName, categoryId: parentChannelId || null }) : null)}
        >
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
