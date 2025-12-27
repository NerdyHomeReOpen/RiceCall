import React, { useRef } from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

interface BadgeItemProps {
  badge: Types.Badge;
  position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

const BadgeItem: React.FC<BadgeItemProps> = React.memo(({ badge, position, direction }) => {
  // Hooks
  const contextMenu = useContextMenu();

  // Refs
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handlers
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, right, top, bottom } = e.currentTarget.getBoundingClientRect();
    const x = position === 'left-top' || position === 'left-bottom' ? left : right;
    const y = position === 'left-top' || position === 'right-top' ? top : bottom;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      contextMenu.showBadgeInfoCard(x, y, direction, badge);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  return (
    <Image
      className="badge-info-card-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      src={badge.iconUrl}
      alt={badge.name}
      width={16}
      height={16}
      loading="lazy"
      draggable="false"
    />
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
