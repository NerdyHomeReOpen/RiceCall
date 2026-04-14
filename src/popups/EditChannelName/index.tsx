import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface EditChannelNamePopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  channel: Types.Channel;
}

const EditChannelNamePopup: React.FC<EditChannelNamePopupProps> = React.memo(({ id, serverId, channel }) => {
  const { t } = useTranslation();

  const [channelName, setChannelName] = useState<string>(channel.name);

  const canSubmit = channelName.trim();

  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Actions.editChannel(serverId, channel.channelId, { name: channelName });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="input-box col">
            <div className="label">{t('channel-name-label')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={handleChannelNameChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('save')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelNamePopup.displayName = 'EditChannelNamePopup';

export default EditChannelNamePopup;
