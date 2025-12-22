import React, { useRef } from 'react';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import styles from '@/styles/badge.module.css';

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

  return (
    <div
      className="badge-info-card-container"
      onMouseEnter={(e) => {
        const { left, right, top, bottom } = e.currentTarget.getBoundingClientRect();
        const x = position === 'left-top' || position === 'left-bottom' ? left : right;
        const y = position === 'left-top' || position === 'right-top' ? top : bottom;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
          contextMenu.showBadgeInfoCard(x, y, direction, badge);
        }, 200);
      }}
      onMouseLeave={() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
    >
      <div className={styles['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
