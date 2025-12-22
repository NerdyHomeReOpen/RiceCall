import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import popupStyles from '@/styles/popup.module.css';

interface EditChannelNamePopupProps {
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  channel: Types.Channel;
}

const EditChannelNamePopup: React.FC<EditChannelNamePopupProps> = React.memo(({ serverId, channelId, channel }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channelName, setChannelName] = useState<string>(channel.name);

  // Variables
  const canSubmit = channelName.trim();

  // Handlers
  const handleEditChannel = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('channel-name-label')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={(e) => setChannelName(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleEditChannel(serverId, channelId, { name: channelName }) : null)}>
          {t('save')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelNamePopup.displayName = 'EditChannelNamePopup';

export default EditChannelNamePopup;
