import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import styles from './PopupHeader.module.css';

interface PopupHeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  popupType: Types.PopupType;
  isFullscreen: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const PopupHeader: React.FC<PopupHeaderProps> = React.memo(({ title, buttons, popupType, isFullscreen, onMinimize, onMaximize, onRestore, onClose }) => {
  const { t } = useTranslation();

  const handleMinimizeBtnClick = () => {
    onMinimize();
  };

  const handleMaximizeBtnClick = () => {
    onMaximize();
  };

  const handleRestoreBtnClick = () => {
    onRestore();
  };

  const handleCloseBtnClick = () => {
    onClose();
  };

  return (
    <header className={styles['header']} data-draggable>
      <div className={styles['title-box']} data-popup-type={popupType}>
        <div className={styles['title-text']}>{t(title)}</div>
      </div>
      <div className={styles['buttons']}>
        {buttons.includes('minimize') && <div className={styles['minimize-button']} onClick={handleMinimizeBtnClick} />}
        {buttons.includes('maxsize') &&
          (isFullscreen ? <div className={styles['restore-button']} onClick={handleRestoreBtnClick} /> : <div className={styles['maxsize-button']} onClick={handleMaximizeBtnClick} />)}
        {buttons.includes('close') && <div className={styles['close-button']} onClick={handleCloseBtnClick} />}
      </div>
    </header>
  );
});

PopupHeader.displayName = 'PopupHeader';

export default PopupHeader;
