import React, { useEffect, useRef } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/providers/Loading';

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
  message: React.ReactNode | string;
  submitTo: string;
  timestamp?: number;
}

const DialogPopup: React.FC<DialogPopupProps> = ({ iconType, message, submitTo, timestamp }) => {
  // Hooks
  const { t } = useTranslation();
  const loadingBox = useLoading();

  // Refs
  const containerRef = useRef<HTMLFormElement>(null);

  // Variables
  const formatedMessage = typeof message === 'string' ? t(message) : message;

  // Handlers
  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    containerRef.current?.focus();

    if (loadingBox.isLoading) {
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: '',
          serverId: '',
          timestamp: Date.now(),
        }),
      );
    }
  }, [loadingBox.isLoading]);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup[DIALOG_ICON[iconType]]}`} />
          {formatedMessage} {timestamp ? `(${new Date(timestamp).toLocaleString()})` : ''}
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleSubmit()}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
};

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
