import React, { useEffect, useRef, useState } from 'react';
import * as Picker from 'emoji-picker-react';

// CSS
import emoji from '@/styles/viewers/emoji.module.css';

// Components
import emojis, { Emoji } from './emojis';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  type: 'message' | 'signature';
  preferBelow: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  type,
  preferBelow,
}) => {
  // Refs
  const emojiIconRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // States
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [pickerX, setPickerX] = useState<number>(0);
  const [pickerY, setPickerY] = useState<number>(0);

  // Handlers
  const handleEnterEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target as Node) &&
      !emojiIconRef.current?.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  };

  // Effects
  useEffect(() => {
    if (!emojiIconRef.current) return;

    const iconHeight = emojiIconRef.current.offsetHeight;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const marginEdge = 10;

    let newPosX = emojiIconRef.current.getBoundingClientRect().left;
    let newPosY = emojiIconRef.current.getBoundingClientRect().top;

    if (!emojiPickerRef.current) return;

    const pickerWidth = emojiPickerRef.current.offsetWidth;
    const pickerHeight = emojiPickerRef.current.offsetHeight;

    if (pickerWidth === 0 || pickerHeight === 0) {
      return;
    }

    if (preferBelow) {
      newPosY += iconHeight;
    } else {
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
  }, [emojiIconRef.current, emojiPickerRef.current]);

  useEffect(() => {
    document.addEventListener('keydown', handleEnterEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEnterEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={emojiIconRef}
      className={emoji['emojiIcon']}
      onMouseDown={(e) => {
        e.preventDefault();
        setShowEmojiPicker(!showEmojiPicker);
      }}
    >
      {type === 'message' && showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className={emoji['emojiGrid']}
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
              data-id={e.id + 1}
              onClick={() => {
                onEmojiSelect?.(`[emoji_${e.id}]`);
              }}
            />
          ))}
        </div>
      )}

      {type === 'signature' && showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className={emoji['emojiPicker']}
          style={{
            left: pickerX,
            top: pickerY,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Picker.default
            style={{
              width: '100%',
              height: '100%',
            }}
            onEmojiClick={(e) => {
              onEmojiSelect?.(e.emoji);
            }}
          />
        </div>
      )}
    </div>
  );
};

EmojiPicker.displayName = 'EmojiPicker';

export default EmojiPicker;
