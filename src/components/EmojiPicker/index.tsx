import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_EMOJIS, TW_EMOJIS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import EmojiItem from './EmojiItem';

import styles from './EmojiPicker.module.css';

interface EmojiPickerProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  anchorEl?: HTMLElement | null;
  showFontbar?: boolean;
  fontSize?: string;
  textColor?: string;
  onEmojiSelect?: (code: string, full: string) => void;
  onFontSizeChange?: (size: string) => void;
  onTextColorChange?: (color: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = React.memo(
  ({ x, y, direction, anchorEl, showFontbar = false, fontSize: propFontSize = '13px', textColor: propTextColor = '#000000', onEmojiSelect, onFontSizeChange, onTextColorChange }) => {
    const { showColorPicker } = useContextMenu();
    const { t } = useTranslation();

    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const [display, setDisplay] = useState(false);
    const [pickerX, setPickerX] = useState<number>(x);
    const [pickerY, setPickerY] = useState<number>(y);
    const [activeTab, setActiveTab] = useState<'def' | 'other' | 'vip'>('def');
    const [fontSize, setFontSize] = useState<string>(propFontSize);
    const [selectedColor, setSelectedColor] = useState<string>(propTextColor);

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const size = e.target.value;
      setFontSize(size);
      onFontSizeChange?.(size);
    };

    const handleColorPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { right: x, top: y } = e.currentTarget.getBoundingClientRect();
      showColorPicker(x, y, 'left-top', (color) => {
        setSelectedColor(color);
        onTextColorChange?.(color);
      });
    };

    const handleDefTabClick = () => {
      setActiveTab('def');
    };

    const handleOtherTabClick = () => {
      setActiveTab('other');
    };

    const handleVipTabClick = () => {
      setActiveTab('vip');
    };

    const handleEmojiSelect = (code: string, full: string) => {
      onEmojiSelect?.(code, full);
    };

    useLayoutEffect(() => {
      setFontSize(propFontSize);
    }, [propFontSize]);

    useLayoutEffect(() => {
      setSelectedColor(propTextColor);
    }, [propTextColor]);

    useLayoutEffect(() => {
      if (!emojiPickerRef.current) return;

      const recalc = () => {
        if (!emojiPickerRef.current) return;
        const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = emojiPickerRef.current;
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
        const marginEdge = 10;
        let newPosX = x;
        let newPosY = y;

        if (anchorEl) {
          const rect = anchorEl.getBoundingClientRect();
          const isTop = direction === 'left-top' || direction === 'right-top';
          const isLeft = direction === 'left-top' || direction === 'left-bottom';
          const gap = 6;
          newPosX = isLeft ? rect.left - (pickerWidth - rect.width) : rect.left;
          if (!isLeft && newPosX + pickerWidth + marginEdge > windowWidth) {
            newPosX = rect.right - pickerWidth;
          }
          if (isLeft && newPosX < marginEdge) {
            newPosX = rect.left;
          }
          newPosY = isTop ? rect.top - pickerHeight - gap : rect.bottom + gap;
        } else {
          if (direction === 'left-top' || direction === 'right-top') {
            newPosY -= pickerHeight;
          }
          if (direction === 'left-top' || direction === 'left-bottom') {
            newPosX -= pickerWidth;
          }
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
      };

      recalc();
      if (anchorEl) {
        window.addEventListener('resize', recalc);
        window.addEventListener('scroll', recalc, true);
        return () => {
          window.removeEventListener('resize', recalc);
          window.removeEventListener('scroll', recalc, true);
        };
      }
    }, [x, y, direction, anchorEl]);

    return (
      <div
        ref={emojiPickerRef}
        className={`context-menu-container ${styles['panel']} ${!showFontbar ? styles['panel-compact'] : ''}`}
        style={display ? { left: pickerX, top: pickerY, position: 'fixed' } : { opacity: 0, position: 'fixed' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showFontbar && (
          <div className={styles['font-bar']}>
            <div className={styles['font-icon']} aria-hidden="true" />
            <div className="select-box ${styles['font-select-box']}">
              <div className="select-box">
                <select value={fontSize} onChange={handleFontSizeChange}>
                  {Array.from({ length: 17 }, (_, i) => (
                    <option key={i} value={`${i + 8}px`}>
                      {i + 8}px
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`${styles['color-select-box']}`} onMouseDown={handleColorPickerClick}>
              <div className={styles['color-swatch']} style={{ backgroundColor: selectedColor }} />
            </div>
          </div>
        )}
        <div className={styles['pages']}>
          <div className={`${styles['page']} ${activeTab === 'def' ? styles['active'] : ''}`} aria-labelledby="btn-def" tabIndex={0}>
            <div className={styles['grid']}>
              {DEFAULT_EMOJIS.map((e) => (
                <EmojiItem key={`def-${e.code}`} emoji={e} onEmojiSelect={handleEmojiSelect} />
              ))}
            </div>
          </div>
          <div className={`${styles['page']} ${activeTab === 'other' ? styles['active'] : ''}`} aria-labelledby="btn-other" tabIndex={0}>
            <div className={styles['grid']}>
              {TW_EMOJIS.map((e) => (
                <EmojiItem key={`other-${e.code}`} emoji={e} onEmojiSelect={handleEmojiSelect} />
              ))}
            </div>
          </div>
          <div className={`${styles['page']} ${activeTab === 'vip' ? styles['active'] : ''}`} aria-labelledby="btn-vip" tabIndex={0}>
            <div className={styles['vip-placeholder']}>{t('soon')}</div>
          </div>
        </div>
        <div className={styles['tabs']} role="tablist">
          <button id="btn-def" className={`${styles['tab-button']} ${styles['tab-def']}`} role="tab" aria-selected={activeTab === 'def'} onClick={handleDefTabClick} />
          <button id="btn-other" className={`${styles['tab-button']} ${styles['tab-other']}`} role="tab" aria-selected={activeTab === 'other'} onClick={handleOtherTabClick} />
          <button id="btn-vip" className={`${styles['tab-button']} ${styles['tab-vip']}`} role="tab" aria-selected={activeTab === 'vip'} onClick={handleVipTabClick} />
        </div>
      </div>
    );
  },
);

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
