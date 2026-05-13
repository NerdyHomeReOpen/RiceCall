import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

interface ChannelPasswordPopupProps {
  id: string;
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();

  const [password, setPassword] = useState<string>('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmitBtnClick = () => {
    ipc.popup.submit(id, password);
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="input-box col">
            <div className="label">{t('please-enter-the-channel-password')}</div>
            <input type="text" maxLength={4} onChange={handlePasswordChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleSubmitBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
