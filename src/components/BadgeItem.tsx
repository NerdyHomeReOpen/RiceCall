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
  preferTop?: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = React.memo(({ badge, preferTop = false }) => {
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
      className="context-menu-container"
      onClick={(e) => {
        if (!badgeRef.current) return;
        const x = badgeRef.current.getBoundingClientRect().left;
        const y = badgeRef.current.getBoundingClientRect().bottom;
        contextMenu.showBadgeInfoCard(x, y, preferTop, false, badge);
      }}
    >
      <div className={styles['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
