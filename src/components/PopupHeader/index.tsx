import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import styles from '@/styles/Header.module.css';

interface PopupHeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  popupType?: Types.PopupType;
  isFullscreen?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onClose?: () => void;
}

const PopupHeader: React.FC<PopupHeaderProps> = React.memo(({ title, buttons, popupType, isFullscreen, onMinimize, onMaximize, onRestore, onClose }) => {
  const { t } = useTranslation();

  return (
    <header className={`${styles['header']} ${styles['popup']}`}>
      <div className={styles['title-wrapper']}>
        <div className={`${styles['title-box']} ${popupType === 'changeTheme' ? styles['title-box-skin-icon'] : popupType === 'directMessage' ? styles['title-box-direct-message-icon'] : ''}`}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(title)}</div>
        </div>
        <div className={styles['buttons']}>
          {buttons.includes('minimize') && <div className={styles['minimize']} onClick={onMinimize} />}
          {buttons.includes('maxsize') && (isFullscreen ? <div className={styles['restore']} onClick={onRestore} /> : <div className={styles['maxsize']} onClick={onMaximize} />)}
          {buttons.includes('close') && <div className={styles['close']} onClick={onClose} />}
        </div>
      </div>
    </header>
  );
});

PopupHeader.displayName = 'PopupHeader';

export default PopupHeader;
