import React from 'react';

// Types
import type { Member, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// CSS
import styles from '@/styles/serverApplication.module.css';
import popup from '@/styles/popup.module.css';

interface ServerApplicationPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  member: Member;
}

const ServerApplicationPopup: React.FC<ServerApplicationPopupProps> = React.memo(() => {
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
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={styles['middle-area']}>
          <div className={styles['button-item-box']}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('vote')}</div>
          </div>
          <div className={`${styles['button-item-box']} ${styles['active']}`} onClick={handleOpenChannelEvent}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('channel-event')}</div>
          </div>
          <div className={`${styles['button-item-box']} ${styles['active']}`} onClick={handleOpenShowFrame}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('send-flower')}</div>
          </div>
          <div className={styles['button-item-box']}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('scratch-card')}</div>
          </div>
          <div className={styles['button-item-box']}>
            <div className={styles['button-item-icon']}></div>
            <div className={styles['button-item-text']}>{t('show-room')}</div>
          </div>
        </div>
      </div>
      <div className={popup['popup-footer']}>
        <div className={styles['placeholder']}></div>
      </div>
    </div>
  );
});

ServerApplicationPopup.displayName = 'ServerApplicationPopup';

export default ServerApplicationPopup;
