import React from 'react';

// CSS
import styles from '@/styles/viewers/badge.module.css';

// Types
import type { Badge } from '@/types';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';

// Cache
const failedImageCache = new Set<string>();

interface BadgeContainerProps {
  badge: Badge;
  preferTop?: boolean;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(
  ({ badge, preferTop = false }) => {
    // Hooks
    const contextMenu = useContextMenu();
    const badgeRef = React.useRef<HTMLDivElement>(null);

    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    if (failedImageCache.has(badgeUrl)) {
      // Fallback Badge
      return <div className={styles['badgeBigImage']} />;
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
        <div
          className={styles.badgeImage}
          style={{ backgroundImage: `url(${badgeUrl})` }}
        />
      </div>
    );
  },
);

BadgeContainer.displayName = 'BadgeContainer';

interface BadgeListViewerProps {
  badges: Badge[];
  maxDisplay?: number;
  preferTop?: boolean;
}

const BadgeListViewer: React.FC<BadgeListViewerProps> = React.memo(
  ({ badges, preferTop, maxDisplay = 21 }) => {
    const sortedBadges = [...badges]
      .sort((a, b) =>
        a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt,
      )
      .slice(0, maxDisplay);

    return (
      <div className={styles.badgeViewerWrapper}>
        {sortedBadges.map((badge) => (
          <BadgeContainer
            key={badge.badgeId}
            badge={badge}
            preferTop={preferTop}
          />
        ))}
      </div>
    );
  },
);

BadgeListViewer.displayName = 'BadgeListViewer';

export default BadgeListViewer;
