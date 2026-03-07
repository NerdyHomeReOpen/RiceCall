import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/ipc';

import MarkdownContent from '@/components/MarkdownContent';

import popupStyles from '@/styles/popup.module.css';

interface RTCDisconnectPopupProps {
  id: string;
  count?: number;
}

const RTCDisconnectPopup: React.FC<RTCDisconnectPopupProps> = React.memo(({ id, count }) => {
  // Hooks
  const { t } = useTranslation();

  // State
  const [currentCount, setCurrentCount] = useState(count || 1);

  // Handlers
  const handleClose = () => {
    ipc.popup.close(id);
  };

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('webrtcDisconnectCountUpdate', (newCount) => {
      setCurrentCount(newCount);
    });

    return () => unsub();
  }, []);

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles['info']}`} />
          <div className={popupStyles['dialog-message']}>
            <MarkdownContent markdownText={t('rtc-disconnect-message', { count: currentCount })} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('confirm')}
        </div>
      </div>
    </div>
  );
});

RTCDisconnectPopup.displayName = 'RTCDisconnectPopup';

export default RTCDisconnectPopup;
