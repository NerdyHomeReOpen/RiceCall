import React from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import styles from './ServerAnnouncement.module.css';

interface ServerAnnouncementPopupProps {
  id: string;
  announcement: Types.Server['announcement'];
}

const ServerAnnouncementPopup: React.FC<ServerAnnouncementPopupProps> = React.memo(({ id, announcement }) => {
  const { t } = useTranslation();

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div data-draggable className="popup-wrapper">
      <div className={styles['headers']}>
        <div className={styles['tabs']}>
          <span>{t('announcement')}</span>
        </div>
        <div className={styles['action-bars']}>
          <div className={styles['close-btn']} onClick={handleCloseBtnClick} />
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
