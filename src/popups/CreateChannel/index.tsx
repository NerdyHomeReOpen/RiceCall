import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

import { getDefaultChannel } from '@/utils/default';

interface CreateChannelPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  parent: Types.Channel | null;
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ id, serverId, parent }) => {
  const { t } = useTranslation();

  const [channelName, setChannelName] = useState<string>(getDefaultChannel({ type: 'channel' }).name);

  const canSubmit = channelName.trim();

  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Actions.createChannel(serverId, { name: channelName, categoryId: parent?.channelId || null });
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content col">
          <div className="input-box">
            <div className="label">{t('parent-channel')}</div>
            <div className="label">{parent?.name || t('none')}</div>
          </div>
          <div className="input-box">
            <div className="label">{t('channel-name')}</div>
            <input name="channel-name" type="text" value={channelName} maxLength={32} onChange={handleChannelNameChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
