import React, { useState } from 'react';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelPasswordPopupProps {
  submitTo: 'channelPassword';
}

const ChannelPasswordPopup: React.FC<ChannelPasswordPopupProps> = React.memo(({ submitTo }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [password, setPassword] = useState<string>('');

  // Handlers
  const handleSubmit = () => {
    ipcService.popup.submit(submitTo, password);
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-enter-the-channel-password')}</div>
            <input
              type="text"
              value={password || ''}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') setPassword('');
                else setPassword(value);
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${password && password.length <= 4 ? '' : 'disabled'}`}
          onClick={() => {
            handleSubmit();
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

ChannelPasswordPopup.displayName = 'ChannelPasswordPopup';

export default ChannelPasswordPopup;
