import React from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { fromTags } from '@/utils/tagConverter';

// Components
import MarkdownContent from '@/components/MarkdownContent';

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
  const formattedMessageContents = fromTags(t(message, parameter));

  // Handlers
  const handleSubmit = () => {
    ipc.popup.submit(submitTo);
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup[DIALOG_ICON[iconType]]}`} />
          <div className={popup['dialog-message']}>
            <MarkdownContent markdownText={`${formattedMessageContents} ${timestamp ? `(${new Date(timestamp).toLocaleString()})` : ''}`} />{' '}
          </div>
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
