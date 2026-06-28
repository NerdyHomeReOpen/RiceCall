import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './EmbedLinkInput.module.css';

interface EmbedLinkInputProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onSubmit: (linkUrl: string) => void;
  onClose: () => void;
}

const EmbedLinkInput: React.FC<EmbedLinkInputProps> = React.memo(({ x, y, direction, onSubmit, onClose }) => {
  const { t } = useTranslation();

  const embedLinkInputEl = useRef<HTMLDivElement>(null);

  const [isDisplayed, setIsDisplayed] = useState(false);
  const [positionX, setPositionX] = useState<number>(x);
  const [positionY, setPositionY] = useState<number>(y);
  const [linkUrl, setLinkUrl] = useState<string>('');

  const handleLinkUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkUrl(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    onSubmit(linkUrl);
    onClose();
  };

  const handleCloseBtnClick = () => {
    onClose();
  };

  useLayoutEffect(() => {
    if (!embedLinkInputEl.current) return;

    const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = embedLinkInputEl.current;
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

    setPositionX(newPosX);
    setPositionY(newPosY);
    setIsDisplayed(true);
  }, [x, y, direction]);

  return (
    <div ref={embedLinkInputEl} className={`context-menu-container col ${styles['input-dropdown']}`} style={isDisplayed ? { left: positionX, top: positionY } : { opacity: 0 }}>
      <div className="input-box col">
        <div className="label">{t('link')}</div>
        <input type="text" placeholder="YouTube/Twitch/Kick" value={linkUrl} onChange={handleLinkUrlChange} />
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="button" onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EmbedLinkInput.displayName = 'EmbedLinkInput';

export default EmbedLinkInput;
