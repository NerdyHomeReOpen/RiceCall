import React from 'react';

// CSS
import badgeStyle from '@/styles/badge.module.css';

// Types
import type { Badge } from '@/types';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';

// Cache
const failedImageCache = new Set<string>();

interface BadgeItemProps {
  badge: Badge;
  position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

const BadgeItem: React.FC<BadgeItemProps> = React.memo(({ badge, position, direction }) => {
  // Hooks
  const contextMenu = useContextMenu();

  if (failedImageCache.has(badge.iconUrl)) {
    // Fallback Badge
    return <div className={badgeStyle['badge-big-image']} />;
  }

  return (
    <div
      className="badge-info-card-container"
      onClick={(e) => {
        const x = position === 'left-top' || position === 'left-bottom' ? e.currentTarget.getBoundingClientRect().left : e.currentTarget.getBoundingClientRect().right;
        const y = position === 'left-top' || position === 'right-top' ? e.currentTarget.getBoundingClientRect().top : e.currentTarget.getBoundingClientRect().bottom;
        contextMenu.showBadgeInfoCard(x, y, direction, badge);
      }}
    >
      <div className={badgeStyle['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
