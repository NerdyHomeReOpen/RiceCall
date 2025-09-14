import React, { useEffect, useRef, useState } from 'react';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

interface UserTagInputProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onSubmit: (username: string) => void;
  onClose: () => void;
}

const UserTagInput: React.FC<UserTagInputProps> = React.memo(({ x, y, direction, onSubmit, onClose }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const userTagInputRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);
  const [username, setUsername] = useState<string>('');

  // Effects
  useEffect(() => {
    if (!userTagInputRef.current) return;
    const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = userTagInputRef.current;
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
    <div ref={userTagInputRef} className={`context-menu-container ${setting['input-dropdown']} ${popup['col']}`} style={display ? { left: pickerX, top: pickerY } : { opacity: 0 }}>
      <div className={`${popup['input-box']} ${popup['col']}`}>
        <div className={popup['label']}>{t('username')}</div>
        <input type="text" placeholder="e.g. Whydog" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className={popup['row']} style={{ justifyContent: 'space-between' }}>
        <div
          className={popup['button']}
          onClick={() => {
            onSubmit(username);
            onClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={onClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

UserTagInput.displayName = 'UserTagInput';

export default UserTagInput;
