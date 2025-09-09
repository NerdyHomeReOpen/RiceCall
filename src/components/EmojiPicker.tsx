import React, { useEffect, useRef, useState } from 'react';

// CSS
import emoji from '@/styles/emoji.module.css';

// Data
import { emojis } from '@/emojis';

interface EmojiPickerProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onEmojiSelect: (code: string, full: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = React.memo(({ x, y, direction, onEmojiSelect }) => {
  // Refs
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);

  // Effects
  useEffect(() => {
    if (!emojiPickerRef.current) return;
    const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = emojiPickerRef.current;
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
    <div ref={emojiPickerRef} className={`context-menu-container ${emoji['emoji-grid']}`} style={display ? { left: pickerX, top: pickerY } : { opacity: 0 }} onMouseDown={(e) => e.stopPropagation()}>
      {emojis.map((e) => (
        <div
          key={e.code}
          className={emoji['emoji']}
          style={{
            backgroundImage: `url(${e.path})`,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            onEmojiSelect?.(e.code, `[emoji=${e.code}]`);
          }}
        />
      ))}
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
