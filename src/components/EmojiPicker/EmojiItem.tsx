/* eslint-disable @next/next/no-img-element */
import React from 'react';

import type * as Types from '@/types';

import emojiStyles from '@/styles/Emoji.module.css';

interface EmojiItemProps {
  emoji: Types.Emoji;
  onEmojiSelect?: (code: string, full: string) => void;
}

const EmojiItem: React.FC<EmojiItemProps> = React.memo(({ emoji, onEmojiSelect }) => {
  const handleClick = () => {
    onEmojiSelect?.(emoji.code, `:${emoji.code}:`);
  };

  return (
    <div className={emojiStyles['emoji']}>
      <img src={emoji.path} alt={emoji.alt} width={16} height={16} loading="lazy" draggable="false" onMouseDown={(e) => e.preventDefault()} onClick={handleClick} />
    </div>
  );
});

EmojiItem.displayName = 'EmojiItem';

export default EmojiItem;
