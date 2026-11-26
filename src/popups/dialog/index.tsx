import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import MarkdownContent from '@/components/markdown-content';

import { fromTags } from '@/utils/tag-converter';

enum DIALOG_ICON {
  ALERT = 'alert',
  ALERT2 = 'alert2',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

type DialogPopupProps = Types.PopupProps<'dialogInfo'> & { iconType: keyof typeof DIALOG_ICON };

const DialogPopup: React.FC<DialogPopupProps> = React.memo(({ id, iconType, message, parameter, error }) => {
  const { t } = useTranslation();
  const formattedMessageContents = fromTags(t(message ?? error?.message ?? '', parameter));

  // crypto.randomUUID only exists in secure contexts; getRandomValues also works on plain http.
  const errorId = error ? Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) => byte.toString(16).padStart(2, '0')).join('') : undefined;

  const handleSubmitBtnClick = () => {
    ipc.popup.submit(id);
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  useEffect(() => {
    if (errorId && error) {
      ipc.error.submit(errorId, error);
    }
  }, [errorId, error]);

  return (
    <div className="popup-wrapper" tabIndex={0}>
      <div className="popup-body">
        <div className="dialog-content">
          <div className={`dialog-icon ${DIALOG_ICON[iconType]}`} />
          <div className="dialog-message">
            <MarkdownContent markdownText={`${error ? `(${errorId}) ` : ''}${formattedMessageContents}`} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleSubmitBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

DialogPopup.displayName = 'DialogPopup';

export default DialogPopup;
