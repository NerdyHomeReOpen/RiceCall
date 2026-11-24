import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_EMOJIS, TW_EMOJIS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import EmojiItem from './EmojiItem';

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
    const [isVisible, setIsVisible] = useState(false);
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
        setIsVisible(true);
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
        className={`context-menu-container absolute z-10000 box-border flex flex-col pr-px pb-px overflow-hidden bg-background rounded-[2px] shadow-box-shadow ${!showFontbar ? 'h-[200px]' : ''}`}
        style={isVisible ? { left: pickerX, top: pickerY, position: 'fixed' } : { opacity: 0, position: 'fixed' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showFontbar && (
          <div className="flex gap-[5px] items-center h-[34px] pt-[10px] pl-[10px]">
            <div className="flex-[0_0_12px] w-[12px] h-[12px] mr-[8px] ml-[10px] bg-[url('/channel/FontButton.svg')] bg-no-repeat bg-center bg-contain" aria-hidden="true" />
            <div className="select-box w-[65px]!">
              <div className="select-box w-full">
                <select value={fontSize} onChange={handleFontSizeChange}>
                  {Array.from({ length: 17 }, (_, i) => (
                    <option key={i} value={`${i + 8}px`}>
                      {i + 8}px
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="relative flex items-center w-[90px] min-w-max max-w-full h-[28px] ml-[8px] overflow-visible border border-border before:absolute before:right-0 before:bottom-0 before:z-1 before:w-[25px] before:h-[2em] before:pointer-events-none before:content-[''] before:bg-[url('/channel/spliter.svg')] before:bg-no-repeat before:bg-contain after:absolute after:right-0 after:bottom-[8px] after:w-[26px] after:h-[12px] after:pointer-events-none after:content-[''] after:bg-[url('/login_combobox_triangle.svg')] after:bg-no-repeat after:bg-cover hover:after:bg-position-[-26px_0] active:after:bg-position-[-52px_0]"
              onMouseDown={handleColorPickerClick}
            >
              <div className="w-[50px] h-[17px] ml-[6px] cursor-pointer border border-border" style={{ backgroundColor: selectedColor }} />
            </div>
          </div>
        )}
        <div className="relative box-border self-center w-[250px] h-[145px] m-[10px] overflow-hidden">
          <div
            className={`w-full h-full overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 ${activeTab === 'def' ? 'block' : 'hidden'}`}
            aria-labelledby="btn-def"
            tabIndex={0}
          >
            <div className="grid grid-cols-[repeat(10,1fr)] auto-rows-[24px] gap-0 w-full h-full p-0 overflow-auto bg-background border-t border-l border-t-[#0000001f] border-l-[#0000001f]">
              {DEFAULT_EMOJIS.map((e) => (
                <EmojiItem key={`def-${e.code}`} emoji={e} onEmojiSelect={handleEmojiSelect} />
              ))}
            </div>
          </div>
          <div
            className={`w-full h-full overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 ${activeTab === 'other' ? 'block' : 'hidden'}`}
            aria-labelledby="btn-other"
            tabIndex={0}
          >
            <div className="grid grid-cols-[repeat(10,1fr)] auto-rows-[24px] gap-0 w-full h-full p-0 overflow-auto bg-background border-t border-l border-t-[#0000001f] border-l-[#0000001f]">
              {TW_EMOJIS.map((e) => (
                <EmojiItem key={`other-${e.code}`} emoji={e} onEmojiSelect={handleEmojiSelect} />
              ))}
            </div>
          </div>
          <div
            className={`w-full h-full overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 ${activeTab === 'vip' ? 'block' : 'hidden'}`}
            aria-labelledby="btn-vip"
            tabIndex={0}
          >
            <div className="grid place-items-center w-full h-full text-text-color-quaternary">{t('soon')}</div>
          </div>
        </div>
        <div className="flex gap-[8px] items-center h-[32px] bg-background-secondary border-t border-t-border" role="tablist">
          <button
            id="btn-def"
            className="relative w-[42px] h-[32px] p-0 cursor-pointer bg-transparent border-none before:block before:w-[42px] before:h-[32px] before:content-[''] before:bg-no-repeat before:bg-position-[0_-1px] before:opacity-85 hover:before:bg-position-[-42px_-1px] aria-selected:before:bg-position-[0_-32px] ml-[15px] before:bg-[url('/im/deftab.svg')]"
            role="tab"
            aria-selected={activeTab === 'def'}
            onClick={handleDefTabClick}
          />
          <button
            id="btn-other"
            className="relative w-[42px] h-[32px] p-0 cursor-pointer bg-transparent border-none before:block before:w-[42px] before:h-[32px] before:content-[''] before:bg-no-repeat before:bg-position-[0_-1px] before:opacity-85 hover:before:bg-position-[-42px_-1px] aria-selected:before:bg-position-[0_-32px] before:bg-[url('/im/vipEm_Sign.svg')]"
            role="tab"
            aria-selected={activeTab === 'other'}
            onClick={handleOtherTabClick}
          />
          <button
            id="btn-vip"
            className="relative w-[42px] h-[32px] p-0 cursor-pointer bg-transparent border-none before:block before:w-[42px] before:h-[32px] before:content-[''] before:bg-no-repeat before:bg-position-[0_-1px] before:opacity-85 hover:before:bg-position-[-42px_-1px] aria-selected:before:bg-position-[0_-32px] before:bg-[url('/im/viptab.svg')]"
            role="tab"
            aria-selected={activeTab === 'vip'}
            onClick={handleVipTabClick}
          />
        </div>
      </div>
    );
  },
);

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
