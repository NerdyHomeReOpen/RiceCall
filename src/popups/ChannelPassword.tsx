import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import popupStyles from '@/styles/popup.module.css';

interface ChannelPasswordPopupProps {
  id: string;
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ id }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [password, setPassword] = useState<string>('');

  // Handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmitBtnClick = () => {
    ipc.popup.submit(id, password);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('please-enter-the-channel-password')}</div>
            <input type="text" maxLength={4} onChange={handlePasswordChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleSubmitBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
