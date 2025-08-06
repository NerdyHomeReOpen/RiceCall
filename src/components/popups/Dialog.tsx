import React from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

enum DIALOG_ICON {
  ALERT = 'alert',
  ALERT2 = 'alert2',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

interface DialogPopupProps {
  iconType: keyof typeof DIALOG_ICON;
  message: string;
  parameter?: Record<string, string>;
  submitTo: string;
  timestamp?: number;
}

const DialogPopup: React.FC<DialogPopupProps> = ({ iconType, message, parameter, submitTo, timestamp }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const formattedMessage = t(message, parameter);

  // Handlers
  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup[DIALOG_ICON[iconType]]}`} />
          {formattedMessage} {timestamp ? `(${new Date(timestamp).toLocaleString()})` : ''}
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={handleSubmit}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
};

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
