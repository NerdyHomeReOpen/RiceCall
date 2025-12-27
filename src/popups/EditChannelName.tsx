import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

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
        <div
          className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            if (!canSubmit) return;
            Popup.editChannel(serverId, channelId, { name: channelName });
            handleClose();
          }}
        >
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
