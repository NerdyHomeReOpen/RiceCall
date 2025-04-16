import React, { useState, useRef } from 'react';

// CSS
import styles from '@/styles/badgeViewer.module.css';

// Types
import type { Badge } from '@/types';

// Constants
const INFOVIEWER_WIDTH = 144;
const INFOVIEWER_HEIGHT = 76;
const SPACING = 8;

// Cache
const failedImageCache = new Set<string>();

interface BadgeContainerProps {
  badge: Badge;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(
  ({ badge }) => {
    // State
    const [expanded, setExpended] = useState<boolean>(false);
    const [top, setTop] = useState<number>(0);
    const [left, setLeft] = useState<number>(0);
    const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

    // Variables
    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // Handlers
    const HandleCalPosition = (rect: DOMRect) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      const placement =
        spaceBelow >= INFOVIEWER_HEIGHT + SPACING || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top';

      const top =
        placement === 'bottom'
          ? rect.bottom + SPACING
          : rect.top - INFOVIEWER_HEIGHT - SPACING - 60;

      let left = rect.left;

      // 修正超出右邊界
      if (left + INFOVIEWER_WIDTH + 155 > windowWidth) {
        left = windowWidth - INFOVIEWER_WIDTH - SPACING - 180;
      }

      // 修正超出左邊界
      if (left < SPACING) {
        left = SPACING;
      }

      setTop(top);
      setLeft(left);
      setPlacement(placement);
    };

    if (failedImageCache.has(badgeUrl)) {
      return (
        // Fallback Badge
        <div className={styles['badgeBigImage']} />
      );
    }

    return (
      <>
        <div
          ref={containerRef}
          className={styles['badgeContainer']}
          onMouseEnter={() => {
            HandleCalPosition(containerRef.current!.getBoundingClientRect());
            setExpended(true);
          }}
          onMouseLeave={() => {
            setExpended(false);
          }}
        >
          <div
            className={styles['badgeImage']}
            style={{ backgroundImage: `url(${badgeUrl})` }}
          />
        </div>
        {expanded && (
          <div
            className={`${styles['badgeInfoViewerWrapper']} ${styles[placement]}`}
            style={{ top: top, left: left }}
          >
            <div className={styles['badgeInfoBox']}>
              <div
                className={styles['badgeBigImage']}
                style={{ backgroundImage: `url(${badgeUrl})` }}
              />
              <div className={styles['badgeText']}>{badge.rare}</div>
            </div>
            <div className={styles['badgeDescriptionBox']}>
              <div className={styles['badgeName']}>{badge.name}</div>
              <div className={styles['badgeDescription']}>
                {badge.description}
              </div>
            </div>
            <div className={styles['badgeShowTimeBox']}>
              <div>展示至:</div>
              <div>1970-01-01</div>
            </div>
          </div>
        )}
      </>
    );
  },
);

BadgeContainer.displayName = 'BadgeContainer';

interface BadgeViewerProps {
  badges: Badge[];
  maxDisplay?: number;
}

const BadgeViewer: React.FC<BadgeViewerProps> = React.memo(({ badges }) => {
  const sortedBadges = [...badges]
    .sort((a, b) =>
      a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt,
    )
    .slice(0, 21);

  return (
    <div className={styles['badgeViewerWrapper']}>
      {sortedBadges.map((badge) => (
        <BadgeContainer key={badge.badgeId} badge={badge} />
      ))}
    </div>
  );
});

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
