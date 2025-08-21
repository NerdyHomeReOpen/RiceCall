import React from 'react';

// CSS
import badgeStyle from '@/styles/badge.module.css';

// Types
import type { Badge } from '@/types';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';

interface BadgeItemProps {
  badge: Badge;
  position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

const BadgeItem: React.FC<BadgeItemProps> = React.memo(({ badge, position, direction }) => {
  // Hooks
  const contextMenu = useContextMenu();

  return (
    <div
      className="badge-info-card-container"
      onClick={(e) => {
        const { left, right, top, bottom } = e.currentTarget.getBoundingClientRect();
        const x = position === 'left-top' || position === 'left-bottom' ? left : right;
        const y = position === 'left-top' || position === 'right-top' ? top : bottom;
        contextMenu.showBadgeInfoCard(x, y, direction, badge);
      }}
    >
      <div className={badgeStyle['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
