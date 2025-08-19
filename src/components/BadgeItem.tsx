import React from 'react';

// CSS
import styles from '@/styles/badge.module.css';

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
  const badgeRef = React.useRef<HTMLDivElement>(null);

  if (failedImageCache.has(badge.iconUrl)) {
    // Fallback Badge
    return <div className={styles['badge-big-image']} />;
  }

  return (
    <div
      ref={badgeRef}
      className="badge-info-card-container"
      onClick={(e) => {
        if (!badgeRef.current) return;
        const x = position === 'left-top' || position === 'left-bottom' ? badgeRef.current.getBoundingClientRect().left : badgeRef.current.getBoundingClientRect().right;
        const y = position === 'left-top' || position === 'right-top' ? badgeRef.current.getBoundingClientRect().top : badgeRef.current.getBoundingClientRect().bottom;
        contextMenu.showBadgeInfoCard(x, y, direction, badge);
      }}
    >
      <div className={styles['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
