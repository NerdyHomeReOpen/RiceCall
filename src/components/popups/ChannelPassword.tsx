import React, { useState } from 'react';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface ChannelPasswordPopupProps {
  submitTo: string;
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ submitTo }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [password, setPassword] = useState<string>('');

  // Handlers
  const handleSubmit = () => {
    ipc.popup.submit(submitTo, password);
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-enter-the-channel-password')}</div>
            <input type="text" maxLength={4} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleSubmit();
            handleClose();
          }}
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

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
