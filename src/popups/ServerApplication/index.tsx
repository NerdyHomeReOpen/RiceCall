import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import styles from './ServerApplication.module.css';

interface ServerApplicationPopupProps {
  id: string;
  server: Types.Server;
}

const ServerApplicationPopup: React.FC<ServerApplicationPopupProps> = React.memo(({ id, server }) => {
  const { t } = useTranslation();

  const handleShowFrameBtnClick = () => {
    ipc.popup.submit('serverApplication', 'openShowFrame');
    ipc.popup.close(id);
  };

  const handleChannelEventBtnClick = () => {
    ipc.popup.submit('serverApplication', 'openChannelEvent');
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className={styles['middle-area']}>
          <div className={`${styles['button-item-box']} disabled`}>
            <div className={styles['button-item-icon']} />
            <div className={styles['button-item-text']}>{t('vote')}</div>
          </div>
          <div className={styles['button-item-box']} onClick={handleChannelEventBtnClick}>
            <div className={styles['button-item-icon']} />
            <div className={styles['button-item-text']}>{t('channel-event')}</div>
          </div>
          <div className={styles['button-item-box']} onClick={handleShowFrameBtnClick}>
            <div className={styles['button-item-icon']} />
            <div className={styles['button-item-text']}>{t('send-flower')}</div>
          </div>
          <div className={`${styles['button-item-box']} disabled`}>
            <div className={styles['button-item-icon']} />
            <div className={styles['button-item-text']}>{t('scratch-card')}</div>
          </div>
          <div className={`${styles['button-item-box']} ${server.isShowAvailable ? '' : 'disabled'}`}>
            <div className={styles['button-item-icon']} />
            <div className={styles['button-item-text']}>{t('show-room')}</div>
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={styles['placeholder']} />
      </div>
    </div>
  );
});

ServerApplicationPopup.displayName = 'ServerApplicationPopup';

export default ServerApplicationPopup;
