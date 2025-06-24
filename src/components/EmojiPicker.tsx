import React, { useEffect, useRef, useState } from 'react';

// CSS
import emoji from '@/styles/emoji.module.css';

// Components
import { emojis, Emoji } from './emojis';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  type: 'custom' | 'unicode';
  x?: number;
  y?: number;
  preferTop?: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = React.memo(({ onEmojiSelect, x = 0, y = 0, preferTop = false }) => {
  // Refs
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // States
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);

  // Effects
  useEffect(() => {
    if (!emojiPickerRef.current) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const marginEdge = 10;

    let newPosX = x;
    let newPosY = y;

    const pickerWidth = emojiPickerRef.current.offsetWidth;
    const pickerHeight = emojiPickerRef.current.offsetHeight;

    if (pickerWidth === 0 || pickerHeight === 0) {
      return;
    }

    if (preferTop) {
      newPosY -= pickerHeight;
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
  }, [x, y, preferTop]);

  return (
    <div
      ref={emojiPickerRef}
      className={`context-menu-container ${emoji['emojiGrid']}`}
      style={{
        left: pickerX,
        top: pickerY,
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {emojis.map((e: Emoji) => (
        <div
          key={e.id}
          className={emoji['emoji']}
          style={{
            backgroundImage: `url(${e.path})`,
          }}
          onClick={() => {
            onEmojiSelect?.(e.char);
          }}
        />
      ))}
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
