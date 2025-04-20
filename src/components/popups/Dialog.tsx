import React, { useEffect, useRef } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

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

const DialogPopup: React.FC<DialogPopupProps> = (
  initialData: DialogPopupProps,
) => {
  // Hooks
  const lang = useLanguage();

  // Variables
  const { iconType, title, submitTo } = initialData;

  const containerRef = useRef<HTMLFormElement>(null);

  // Handlers
  const handleClose = () => {
    ipcService.window.close();
  };

  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <form
      className={popup['popupContainer']}
      tabIndex={0}
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSubmit();
      }}
    >
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={`${popup['inputGroup']} ${popup['dialogCenter']}`}>
            <div className={`${popup['inputBox']} ${popup['dialogContent']}`}>
              <div
                className={`${popup['dialogIcon']} ${
                  popup[DIALOG_ICON[iconType]]
                }`}
              />
              <div className={popup['label']}>{title}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={() => handleSubmit()}>
          {lang.tr.confirm}
        </button>
        <button className={popup['button']} onClick={() => handleClose()}>
          {lang.tr.cancel}
        </button>
      </div>
    </form>
  );
};

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
