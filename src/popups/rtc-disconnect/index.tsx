import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import MarkdownContent from '@/components/markdown-content';

type RTCDisconnectPopupProps = Types.PopupProps<'rtcDisconnect'>;

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
            <MarkdownContent markdownText={t('rtc-disconnect-message', { '0': currentCount })} />
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
