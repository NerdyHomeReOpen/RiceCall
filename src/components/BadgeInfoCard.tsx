import React, { useState, useEffect, useRef } from 'react';

// CSS
import badgeInfoCardStyles from '@/styles/badgeInfoCard.module.css';

// Types
import type { Badge } from '@/types';

// Providers
// import { useLanguage } from '@/providers/Language';

interface BadgeInfoCardProps {
  x: number;
  y: number;
  badge: Badge;
}

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(
  ({ x, y, badge }) => {
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);

    // const lang = useLanguage();

    // State
    const [cardX, setCardX] = useState(x);
    const [cardY, setCardY] = useState(y);

    // Variables
    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    // Effect
    useEffect(() => {
      const cardWidth = cardRef.current!.offsetWidth;
      const cardHeight = cardRef.current!.offsetHeight;
      const windowWidth = window.innerWidth;

      let newCardX = x;
      let newCardY = y - cardHeight;

      if (newCardX + cardWidth > windowWidth) {
        newCardX = windowWidth - cardWidth - 20;
      }

      if (newCardY < 0) {
        newCardY = 20;
      }

      setCardX(newCardX);
      setCardY(newCardY);
    }, [x, y]);

    return (
      <div
        ref={cardRef}
        className={`context-menu-container ${badgeInfoCardStyles.badgeInfoCard}`}
        style={{ top: cardY, left: cardX }}
      >
        <div className={badgeInfoCardStyles.badgeInfoWrapper}>
          <div className={badgeInfoCardStyles.badgeAvatarBox}>
            <div
              className={badgeInfoCardStyles.badgeImage}
              style={{ backgroundImage: `url(${badgeUrl})` }}
            />
            <div className={badgeInfoCardStyles.badgeRarityText}>
              {`[${badge.rare}]`}
            </div>
          </div>
          <div className={badgeInfoCardStyles.badgeDescriptionBox}>
            <div className={badgeInfoCardStyles.badgeName}>{badge.name}</div>
            <div className={badgeInfoCardStyles.badgeDescription}>
              {badge.description}
            </div>
          </div>
        </div>
        <div className={badgeInfoCardStyles.badgeShowTimeBox}>
          <div>展示至:</div>
          <div>1970-01-01</div>
        </div>
      </div>
    );
  },
);

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
