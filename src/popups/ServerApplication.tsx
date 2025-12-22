import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import styles from '@/styles/serverApplication.module.css';
import popupStyles from '@/styles/popup.module.css';

interface ServerApplicationPopupProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  server: Types.Server;
}

const ServerApplicationPopup: React.FC<ServerApplicationPopupProps> = React.memo(({ server }) => {
  // Hooks
  const { t } = useTranslation();

  const handleOpenShowFrame = () => {
    ipc.popup.submit('serverApplication', 'openShowFrame');
    ipc.window.close();
  };

  const handleOpenChannelEvent = () => {
    ipc.popup.submit('serverApplication', 'openChannelEvent');
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={styles['middle-area']}>
          <div className={`${styles['button-item-box']} disabled`}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('vote')}</div>
          </div>
          <div className={styles['button-item-box']} onClick={handleOpenChannelEvent}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('channel-event')}</div>
          </div>
          <div className={styles['button-item-box']} onClick={handleOpenShowFrame}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('send-flower')}</div>
          </div>
          <div className={`${styles['button-item-box']} disabled`}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('scratch-card')}</div>
          </div>
          <div className={`${styles['button-item-box']} ${server.isShowAvailable ? '' : 'disabled'}`}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('show-room')}</div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={styles['placeholder']}></div>
      </div>
    </div>
  );
});

ServerApplicationPopup.displayName = 'ServerApplicationPopup';

export default ServerApplicationPopup;
