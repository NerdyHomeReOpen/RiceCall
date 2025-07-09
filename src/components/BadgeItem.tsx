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

  const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

  if (failedImageCache.has(badgeUrl)) {
    // Fallback Badge
    return <div className={styles['badge-big-image']} />;
  }

  return (
    <div
      ref={badgeRef}
      onMouseEnter={(e) => {
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showBadgeInfoCard(x, y, preferTop, false, badge);
      }}
      onMouseLeave={() => {
        contextMenu.closeBadgeInfoCard();
      }}
    >
      <div className={styles['badge-image']} style={{ backgroundImage: `url(${badgeUrl})` }} />
    </div>
  );
});

BadgeItem.displayName = 'BadgeItem';

export default BadgeItem;
