import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './UnreadMessageAlert.module.css';

interface UnreadMessageAlertProps {
  unreadMessageCount: number;
  onAlertClick: () => void;
}

const UnreadMessageAlert: React.FC<UnreadMessageAlertProps> = ({ unreadMessageCount, onAlertClick }) => {
  const { t } = useTranslation();

  return (
    <>
      {unreadMessageCount > 0 && (
        <div className={styles['unread-message-alert']} onClick={onAlertClick}>
          {t('has-new-message', { 0: unreadMessageCount })}
        </div>
      )}
    </>
  );
};

export default UnreadMessageAlert;
