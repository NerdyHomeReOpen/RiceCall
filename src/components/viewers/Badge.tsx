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
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(
  ({ badge }) => {
    // Hooks
    const contextMenu = useContextMenu();

    // Variables
    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    if (failedImageCache.has(badgeUrl)) {
      return (
        // Fallback Badge
        <div className={styles['badgeBigImage']} />
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          contextMenu.showBadgeInfoCard(e.clientX, e.clientY, badge);
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

interface BadgeViewerProps {
  badges: Badge[];
  maxDisplay?: number;
}

const BadgeViewer: React.FC<BadgeViewerProps> = React.memo(
  ({ badges, maxDisplay = 21 }) => {
    const sortedBadges = [...badges]
      .sort((a, b) =>
        a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt,
      )
      .slice(0, maxDisplay);

    return (
      <div className={styles.badgeViewerWrapper}>
        {sortedBadges.map((badge) => (
          <BadgeContainer key={badge.badgeId} badge={badge} />
        ))}
      </div>
    );
  },
);

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
