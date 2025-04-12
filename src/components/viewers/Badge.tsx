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
    const [showFallBack, setShowFallBack] = useState(false);
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
          : rect.top - INFOVIEWER_HEIGHT - SPACING;
      const left = Math.max(
        SPACING,
        Math.min(
          rect.left - INFOVIEWER_WIDTH / 2,
          windowWidth - INFOVIEWER_WIDTH - SPACING,
        ),
      );

      setTop(top);
      setLeft(left);
      setPlacement(placement);
    };

    if (failedImageCache.has(badgeUrl) || showFallBack) {
      return (
        // Fallback Badge
        <div className={styles['badgeImage']} />
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
            onError={() => {
              failedImageCache.add(badgeUrl);
              setShowFallBack(true);
            }}
          />
        </div>
        {expanded && (
          <div
            className={`${styles['badgeInfoViewerWrapper']} ${styles[placement]}`}
            style={{ top: top, left: left }}
          >
            <div className={styles['badgeInfoBox']}>
              <div
                className={styles['badgeImage']}
                onError={() => {
                  failedImageCache.add(badgeUrl);
                  setShowFallBack(true);
                }}
              />
              <div className={styles['name']}>{badge.name}</div>
            </div>
            <div className={styles['badgeDescriptionBox']}>
              <div className={styles['description']}>{badge.description}</div>
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

const BadgeViewer: React.FC<BadgeViewerProps> = React.memo(
  ({ badges, maxDisplay = 99 }) => {
    // Variables
    const sortedBadges = [...badges]
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      .slice(0, maxDisplay);

    return (
      <div className={styles['badgeViewerWrapper']}>
        {sortedBadges.map((badge) => (
          <BadgeContainer key={badge.badgeId} badge={badge} />
        ))}
      </div>
    );
  },
);

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
