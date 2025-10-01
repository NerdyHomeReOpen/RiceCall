import React, { useEffect, useMemo, useRef, useState } from 'react';

// CSS
import emoji from '@/styles/emoji.module.css';

// Data
import { defEmojis, otherEmojis } from '@/emojis';
import popup from '@/styles/popup.module.css';

interface EmojiPickerProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onEmojiSelect: (code: string, full: string) => void;
  anchorEl?: HTMLElement | null;
  showFontbar?: boolean;
  isUserInfo?: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = React.memo(({ x, y, direction, onEmojiSelect, anchorEl, showFontbar = false, isUserInfo = false }) => {
  // Refs
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);
  const [activeTab, setActiveTab] = useState<'def' | 'other' | 'vip'>('def');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('small');
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const colorBoxRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
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

  useMemo(() => fontSize, [fontSize]);

  useEffect(() => {
    if (!colorPanelOpen) return;
    const handleDocMouseDown = (e: MouseEvent | PointerEvent) => {
      if (!colorBoxRef.current) return;
      if (!colorBoxRef.current.contains(e.target as Node)) {
        setColorPanelOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleDocMouseDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleDocMouseDown, true);
    };
  }, [colorPanelOpen]);

  return (
    <div
      ref={emojiPickerRef}
      className={`context-menu-container ${emoji['emoji-panel']} ${!showFontbar ? emoji['emoji-panel-compact'] : ''}`}
      style={display ? { left: pickerX, top: pickerY, position: 'fixed' } : { opacity: 0, position: 'fixed' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {showFontbar && (
        <div className={emoji['emoji-fontbar']}>
          <div className={emoji['emoji-font-icon']} aria-hidden="true" />
          <div className={`${popup['select-box']} ${emoji['font-select-box']}`}>
            <select className={emoji['emoji-font-select']} value={fontSize} onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}>
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>

          <div
            className={`${emoji['color-select-box']}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              if (e.currentTarget === e.target) setColorPanelOpen((prev) => !prev);
            }}
            ref={colorBoxRef}
          >
            <button type="button" className={emoji['color-swatch']} style={{ backgroundColor: selectedColor }} onClick={() => setColorPanelOpen((prev) => !prev)} />
            {colorPanelOpen && (
              <div
                className={emoji['color-panel']}
                role="listbox"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                {[{ value: '#000000' }, { value: '#0066cc' }, { value: '#2f4f2f' }, { value: '#f39c12' }, { value: '#ff7bac' }, { value: '#00bcd4' }, { value: '#9b59b6' }, { value: '#27ae60' }].map(
                  (c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`${emoji['color-option']}`}
                      style={{ backgroundColor: c.value, outline: selectedColor === c.value ? '2px solid #5898ff' : 'none' }}
                      onClick={() => {
                        setSelectedColor(c.value);
                        setColorPanelOpen(false);
                      }}
                      role="option"
                      aria-selected={selectedColor === c.value}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={emoji['emoji-pages']}>
        <div className={`${emoji['emoji-page']} ${activeTab === 'def' ? emoji['active'] : ''}`} aria-labelledby="btn-def" tabIndex={0}>
          <div className={emoji['emoji-grid']}>
            {defEmojis.map((e) => (
              <div
                key={`def-${e.code}`}
                className={emoji['emoji']}
                style={{ backgroundImage: `url(${e.path})` }}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onEmojiSelect?.(e.code, `:${e.code}:`)}
              />
            ))}
          </div>
        </div>

        <div className={`${emoji['emoji-page']} ${activeTab === 'other' ? emoji['active'] : ''}`} aria-labelledby="btn-other" tabIndex={0}>
          <div className={emoji['emoji-grid']}>
            {otherEmojis.map((e) => (
              <div
                key={`other-${e.code}`}
                className={emoji['emoji']}
                style={{ backgroundImage: `url(${e.path})` }}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onEmojiSelect?.(e.code, `:${e.code}:`)}
                title={e.alt}
              />
            ))}
          </div>
        </div>

        <div className={`${emoji['emoji-page']} ${activeTab === 'vip' ? emoji['active'] : ''}`} aria-labelledby="btn-vip" tabIndex={0}>
          <div className={emoji['emoji-vip-placeholder']}>即將推出...</div>
        </div>
      </div>

      <div className={emoji['emoji-tabs']} role="tablist">
        <button
          id="btn-def"
          className={`${emoji['emoji-tab-btn']} ${emoji['tab-def']} ${isUserInfo ? emoji['user-info-emoji'] : ''}`}
          role="tab"
          aria-selected={activeTab === 'def'}
          onClick={() => setActiveTab('def')}
        >
          <span className={emoji['emoji-tab-label']}>def</span>
        </button>
        <button
          id="btn-other"
          className={`${emoji['emoji-tab-btn']} ${emoji['tab-other']} ${isUserInfo ? emoji['user-info-emoji'] : ''}`}
          role="tab"
          aria-selected={activeTab === 'other'}
          onClick={() => setActiveTab('other')}
        >
          <span className={emoji['emoji-tab-label']}>other</span>
        </button>
        <button
          id="btn-vip"
          className={`${emoji['emoji-tab-btn']} ${emoji['tab-vip']} ${isUserInfo ? emoji['user-info-emoji'] : ''}`}
          role="tab"
          aria-selected={activeTab === 'vip'}
          onClick={() => setActiveTab('vip')}
        >
          <span className={emoji['emoji-tab-label']}>vip</span>
        </button>
      </div>
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
