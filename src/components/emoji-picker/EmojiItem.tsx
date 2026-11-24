import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

interface EmojiItemProps {
  emoji: Types.Emoji;
  onEmojiSelect?: (code: string, full: string) => void;
}

const EmojiItem: React.FC<EmojiItemProps> = React.memo(({ emoji, onEmojiSelect }) => {
  const handleClick = () => {
    onEmojiSelect?.(emoji.code, `:${emoji.code}:`);
  };

  return (
    <div className="flex items-center justify-center p-0 overflow-hidden cursor-pointer border-r border-b border-r-[#0000001f] border-b-[#0000001f] hover:shadow-[inset_0_0_0_1px_var(--main-color)]">
      <Image src={emoji.path} alt="emoji" width={16} height={16} loading="lazy" draggable="false" onMouseDown={(e) => e.preventDefault()} onClick={handleClick} />
    </div>
  );
});

EmojiItem.displayName = 'EmojiItem';

export default EmojiItem;
