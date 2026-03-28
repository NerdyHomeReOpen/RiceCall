import React from 'react';

import styles from '@/styles/header.module.css';

interface PopupHeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
  isFullscreen?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onClose?: () => void;
  className?: string;
}

const PopupHeader: React.FC<PopupHeaderProps> = React.memo(({ title, buttons, titleBoxIcon, isFullscreen, onMinimize, onMaximize, onRestore, onClose, className }) => {
  return (
    <header className={`${styles['header']} ${styles['popup']} ${className || ''}`}>
      <div className={styles['title-wrapper']}>
        <div className={`${styles['title-box']} ${titleBoxIcon || ''}`}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
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