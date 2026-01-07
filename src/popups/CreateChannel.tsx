import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Default from '@/utils/default';
import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface CreateChannelPopupProps {
  serverId: Types.Server['serverId'];
  parent: Types.Channel | null;
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ serverId, parent: parentData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channelName, setChannelName] = useState<string>(Default.channel().name);

  // Variables
  const { channelId: parentChannelId, name: parentChannelName } = parentData || {};
  const canSubmit = channelName.trim();

  // Handlers
  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Popup.createChannel(serverId, { name: channelName, categoryId: parentChannelId || null });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
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
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={handleChannelNameChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
