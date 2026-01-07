import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import MarkdownContent from '@/components/MarkdownContent';

import * as TagConverter from '@/utils/tagConverter';

import popupStyles from '@/styles/popup.module.css';

enum DIALOG_ICON {
  ALERT = 'alert',
  ALERT2 = 'alert2',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

interface DialogPopupProps {
  id: string;
  iconType: keyof typeof DIALOG_ICON;
  message: string;
  parameter?: Record<string, string>;
  timestamp?: number;
}

const DialogPopup: React.FC<DialogPopupProps> = React.memo(({ id, iconType, message, parameter, timestamp }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const formattedMessageContents = TagConverter.fromTags(t(message, parameter));

  // Handlers
  const handleSubmitBtnClick = () => {
    ipc.popup.submit(id);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles[DIALOG_ICON[iconType]]}`} />
          <div className={popupStyles['dialog-message']}>
            <MarkdownContent markdownText={`${formattedMessageContents} ${timestamp ? `(${new Date(timestamp).toLocaleString()})` : ''}`} />{' '}
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

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
