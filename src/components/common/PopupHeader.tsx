import React from 'react';

import headerStyles from '@/styles/header.module.css';

interface PopupHeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string; // CSS class name for the icon
  isFullscreen?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
  onClose?: () => void;
  className?: string;
}

export const PopupHeader: React.FC<PopupHeaderProps> = React.memo(({ title, buttons, titleBoxIcon, isFullscreen, onMinimize, onMaximize, onRestore, onClose, className }) => {
  return (
    <header className={`${headerStyles['header']} ${headerStyles['popup']} ${className || ''}`}>
      <div className={headerStyles['title-wrapper']}>
        <div className={`${headerStyles['title-box']} ${titleBoxIcon || ''}`}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        </div>
        <div className={headerStyles['buttons']}>
          {buttons.includes('minimize') && <div className={headerStyles['minimize']} onClick={onMinimize} />}
          {buttons.includes('maxsize') && (isFullscreen ? <div className={headerStyles['restore']} onClick={onRestore} /> : <div className={headerStyles['maxsize']} onClick={onMaximize} />)}
          {buttons.includes('close') && <div className={headerStyles['close']} onClick={onClose} />}
        </div>
      </div>
    </header>
  );
});

PopupHeader.displayName = 'PopupHeader';
