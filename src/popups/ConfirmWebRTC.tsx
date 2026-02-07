import React, { useEffect, useState } from 'react';
import ipc from '@/ipc';

import MarkdownContent from '@/components/MarkdownContent';

import popupStyles from '@/styles/popup.module.css';

interface ConfirmWebRTCPopupProps {
  id: string;
  count?: number;
}

// eslint-disable-next-line 
const ConfirmWebRTCPopup: React.FC<ConfirmWebRTCPopupProps> = React.memo(({ id, count }) => {
  const [currentCount, setCurrentCount] = useState(count || 1);

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  useEffect(() => {
    const removeListener = ipc.socket.on('webrtcDisconnectCountUpdate', (newCount) => {
      setCurrentCount(newCount);
    });

    return () => {
      removeListener();
    };
  }, []);

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles['info']}`} />
          <div className={popupStyles['dialog-message']}>
            <MarkdownContent markdownText={`我們偵測到 ${currentCount} 次斷線，我們已經蒐集了連線資訊，正在盡力分析 請耐心等待我們修復`} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleClose}>
          {"確定"}
        </div>
      </div>
    </div>
  );
});

ConfirmWebRTCPopup.displayName = 'ConfirmWebRTCPopup';

export default ConfirmWebRTCPopup;
