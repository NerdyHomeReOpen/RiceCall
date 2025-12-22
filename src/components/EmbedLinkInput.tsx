import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import settingStyles from '@/styles/setting.module.css';
import popupStyles from '@/styles/popup.module.css';

interface EmbedLinkInputProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onSubmit: (linkUrl: string) => void;
  onClose: () => void;
}

const EmbedLinkInput: React.FC<EmbedLinkInputProps> = React.memo(({ x, y, direction, onSubmit, onClose }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const embedLinkInputRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Effects
  useEffect(() => {
    if (!embedLinkInputRef.current) return;
    const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = embedLinkInputRef.current;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const marginEdge = 10;
    let newPosX = x;
    let newPosY = y;

    if (direction === 'left-top' || direction === 'right-top') {
      newPosY -= pickerHeight;
    }
    if (direction === 'left-top' || direction === 'left-bottom') {
      newPosX -= pickerWidth;
    }

    if (newPosX + pickerWidth + marginEdge > windowWidth) {
      newPosX = windowWidth - pickerWidth - marginEdge;
    }
    if (newPosX < marginEdge) {
      newPosX = marginEdge;
    }
    if (newPosY + pickerHeight + marginEdge > windowHeight) {
      newPosY = windowHeight - pickerHeight - marginEdge;
    }
    if (newPosY < marginEdge) {
      newPosY = marginEdge;
    }

    setPickerX(newPosX);
    setPickerY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={embedLinkInputRef} className={`context-menu-container ${settingStyles['input-dropdown']} ${popupStyles['col']}`} style={display ? { left: pickerX, top: pickerY } : { opacity: 0 }}>
      <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
        <div className={popupStyles['label']}>{t('link')}</div>
        <input type="text" placeholder="YouTube/Twitch/Kick" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
      </div>
      <div className={popupStyles['row']} style={{ justifyContent: 'space-between' }}>
        <div
          className={popupStyles['button']}
          onClick={() => {
            onSubmit(linkUrl);
            onClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={onClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EmbedLinkInput.displayName = 'EmbedLinkInput';

export default EmbedLinkInput;
