import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import MarkdownContent from '@/components/MarkdownContent';

interface RTCDisconnectPopupProps {
  id: string;
  count?: number;
}

const RTCDisconnectPopup: React.FC<RTCDisconnectPopupProps> = React.memo(({ id, count }) => {
  const { t } = useTranslation();

  const [currentCount, setCurrentCount] = useState(count || 1);

  const handleClose = () => {
    ipc.popup.close(id);
  };

  useEffect(() => {
    const unsub = ipc.socket.on('webrtcDisconnectCountUpdate', (newCount) => {
      setCurrentCount(newCount);
    });

    return () => unsub();
  }, []);

  return (
    <div className="popup-wrapper" tabIndex={0}>
      <div className="popup-body">
        <div className="dialog-content">
          <div className="dialog-icon info" />
          <div className="dialog-message">
            <MarkdownContent markdownText={t('rtc-disconnect-message', { count: currentCount })} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleClose}>
          {t('confirm')}
        </div>
      </div>
    </div>
  );
});

RTCDisconnectPopup.displayName = 'RTCDisconnectPopup';

export default RTCDisconnectPopup;
