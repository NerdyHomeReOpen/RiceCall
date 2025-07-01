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
  title: React.ReactNode;
  submitTo: string;
}

const DialogPopup: React.FC<DialogPopupProps> = ({ iconType, title, submitTo }) => {
  // Hooks
  const { t } = useTranslation();
  const loadingBox = useLoading();

  // Refs
  const containerRef = useRef<HTMLFormElement>(null);

  // Variables
  const formatedTitle = typeof title === 'string' ? t(title) : title;

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
            <div className={popup['label']}>{formatedTitle}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={() => handleSubmit()}>
          {t('confirm')}
        </button>
        <button className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
};

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
