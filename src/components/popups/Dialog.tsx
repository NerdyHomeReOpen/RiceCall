import React, { useEffect, useRef } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

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
    <form
      className={popup['popupContainer']}
      tabIndex={0}
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSubmit();
      }}
    >
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={popup['dialogContent']}>
            <div
              className={`
                ${popup['dialogIcon']}
                ${popup[DIALOG_ICON[iconType]]}
              `}
            />
            <div className={popup['label']}>
              {formatedMessage} {timestamp ? `(${new Date(timestamp).toLocaleString()})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div className={popup['button']} onClick={() => handleSubmit()}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </form>
  );
};

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
