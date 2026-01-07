import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import popupStyles from '@/styles/popup.module.css';
import styles from '@/styles/serverAnnouncement.module.css';

interface ServerAnnouncementPopupProps {
  announcement: Types.Server['announcement'];
}

const ServerAnnouncementPopup: React.FC<ServerAnnouncementPopupProps> = React.memo(({ announcement }) => {
  const { t } = useTranslation();

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={`${popupStyles['popup-wrapper']}`}>
      <div className={styles['headers']}>
        <div className={styles['tabs']}>
          <span>{t('announcement')}</span>
        </div>
        <div className={styles['action-bars']}>
          <div className={styles['close-btn']} onClick={() => handleClose()} />
        </div>
      </div>
      <div className={styles['containers']}>
        <AnnouncementEditor announcement={announcement} showPreview={true} onChange={() => {}} />
      </div>
    </div>
  );
});

ServerAnnouncementPopup.displayName = 'ServerAnnouncementPopup';

export default ServerAnnouncementPopup;
