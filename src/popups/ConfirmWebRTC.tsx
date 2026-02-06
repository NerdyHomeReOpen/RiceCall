import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import MarkdownContent from '@/components/MarkdownContent';

import popupStyles from '@/styles/popup.module.css';

interface ConfirmWebRTCPopupProps {
  id: string;
  message?: string;
  channelId?: string;
  userId?: string;
}

const ConfirmWebRTCPopup: React.FC<ConfirmWebRTCPopupProps> = React.memo(({ id, message, userId }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleYes = () => {
    ipc.popup.submit(id, true);
    ipc.window.close();
  };

  const handleNo = () => {
    ipc.popup.submit(id, false);
    ipc.window.close(); 
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      ipc.window.close();
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles['info']}`} />
          <div className={popupStyles['dialog-message']}>
            <MarkdownContent markdownText="偵測到斷線事件，請問您是否為上麥者然後別人現在突然聽不到你的聲音了，但你還在伺服器內開麥講話？ " />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleYes}>
          {"是"}
        </div>
        <div className={popupStyles['button']} onClick={handleNo}>
          {"否"}
        </div>
      </div>
    </div>
  );
});

ConfirmWebRTCPopup.displayName = 'ConfirmWebRTCPopup';

export default ConfirmWebRTCPopup;
