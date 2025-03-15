/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import dialog from '@/styles/popups/dialog.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

enum DIALOG_ICON {
  ALERT = 'alert',
  ALERT2 = 'alert2',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

interface DialogProps {
  iconType: keyof typeof DIALOG_ICON | null;
  title: React.ReactNode | null;
  submitTo: string | null;
}

const Dialog: React.FC<DialogProps> = (initialData: DialogProps) => {
  // Language
  const lang = useLanguage();

  // Variables
  const iconType = initialData.iconType || 'INFO';
  const title = initialData.title || '未知';
  const submitTo = initialData.submitTo || '';

  // Handlers
  const handleClose = () => {
    ipcService.window.close();
  };

  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  return (
    <div className={popup['popupContainer']}>
      <div className={popup['popupBody']}>
        <div className={dialog['body']}>
          <div className={dialog['inputGroup']}>
            <div className={popup['inputBox']}>
              <div
                className={`${dialog['dialogIcon']} ${
                  popup[DIALOG_ICON[iconType]]
                }`}
              ></div>
              <div className={popup['textBorder']}>
                <div className={popup['title']}>{title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={handleSubmit}>
          {lang.tr.confirm}
        </button>
      </div>
    </div>
  );
};

Dialog.displayName = 'Dialog';

export default Dialog;
