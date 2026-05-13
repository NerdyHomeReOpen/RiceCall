import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import styles from './MaximizedPopup.module.css';

interface MaximizedPopupProps {
  id: string;
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  onRestore: () => void;
}

const MaximizedPopup: React.FC<MaximizedPopupProps> = React.memo(({ title, buttons, id, onRestore }) => {
  const { t } = useTranslation();

  const handleRestoreBtnClick = () => {
    onRestore();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <button key={id} type="button" onClick={handleRestoreBtnClick} title={t(title)} className={styles['popup']}>
      <div className={styles['title-text']}>{t(title)}</div>
      {buttons.includes('close') && <div className={styles['close-button']} onClick={handleCloseBtnClick} title={t('close')} />}
    </button>
  );
});

MaximizedPopup.displayName = 'MaximizedPopup';

export default MaximizedPopup;
