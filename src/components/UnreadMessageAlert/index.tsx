import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './UnreadMessageAlert.module.css';

interface UnreadMessageAlertProps {
  unreadMessageCount: number;
  onClick: () => void;
}

const UnreadMessageAlert: React.FC<UnreadMessageAlertProps> = React.memo(({ unreadMessageCount, onClick }) => {
  const { t } = useTranslation();

  return unreadMessageCount > 0 ? (
    <div className={styles['unread-message-alert']} onClick={onClick}>
      {t('has-new-message', { 0: unreadMessageCount })}
    </div>
  ) : null;
});

UnreadMessageAlert.displayName = 'UnreadMessageAlert';

export default UnreadMessageAlert;
