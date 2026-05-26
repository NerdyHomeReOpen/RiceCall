import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './MaximizedPopup.module.css';

interface MinimizedPopupProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  onRestore: () => void;
  onClose: () => void;
}

const MinimizedPopup: React.FC<MinimizedPopupProps> = React.memo(({ title, buttons, onRestore, onClose }) => {
  const { t } = useTranslation();

  return (
    <button type="button" onClick={onRestore} title={t(title)} className={styles['popup']}>
      <div className={styles['title-text']}>{t(title)}</div>
      {buttons.includes('close') && <div className={styles['close-button']} onClick={onClose} title={t('close')} />}
    </button>
  );
});

MinimizedPopup.displayName = 'MinimizedPopup';

export default MinimizedPopup;
