import React, { useCallback } from 'react';
import Image from 'next/image';

import * as Types from '@/types';

import styles from './EmojiPicker.module.css';

interface EmojiItemProps {
  emoji: Types.Emoji;
  onEmojiSelect?: (code: string, full: string) => void;
}

const EmojiItem: React.FC<EmojiItemProps> = React.memo(({ emoji, onEmojiSelect }) => {
  const handleClick = useCallback(() => {
    if (!onEmojiSelect) return;
    onEmojiSelect(emoji.code, `:${emoji.code}:`);
  }, [emoji.code, onEmojiSelect]);

  return (
    <div className={styles['emoji']}>
      <Image src={emoji.path} alt="emoji" width={16} height={16} loading="lazy" draggable="false" onMouseDown={(e) => e.preventDefault()} onClick={handleClick} />
    </div>
  );
});

EmojiItem.displayName = 'EmojiItem';

export default EmojiItem;
