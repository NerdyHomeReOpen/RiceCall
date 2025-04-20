import React, { useState, useEffect, useRef } from 'react';

// CSS
import badgeInfoCardStyles from '@/styles/badgeInfoCard.module.css';

// Types
import type { Badge } from '@/types';

// Providers
// import { useLanguage } from '@/providers/Language';

interface BadgeInfoCardProps {
  rect: DOMRect;
  badge: Badge;
  preferBelow: boolean;
}

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(
  ({ rect, badge, preferBelow }) => {
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);

    // const lang = useLanguage();

    // State
    const [cardX, setCardX] = useState(0);
    const [cardY, setCardY] = useState(0);
    const [ready, setReady] = useState(false);

    // Variables
    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    // Effect
    useEffect(() => {
      const tryPosition = () => {
        if (!cardRef.current) return;

        const cardWidth = cardRef.current.offsetWidth;
        const cardHeight = cardRef.current.offsetHeight;

        if (cardHeight === 0 || cardWidth === 0) {
          requestAnimationFrame(tryPosition);
          return;
        }

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newCardX = rect.left;
        let newCardY = preferBelow ? rect.bottom : rect.top - cardHeight;

        if (preferBelow) {
          if (newCardY + cardHeight > windowHeight) {
            newCardY = rect.top - cardHeight;
            if (newCardY < 0) newCardY = 20;
          }
        } else {
          if (newCardY < 0) {
            newCardY = rect.bottom;
            if (newCardY + cardHeight > windowHeight) {
              newCardY = windowHeight - cardHeight - 20;
            }
          }
        }

        if (newCardX + cardWidth > windowWidth) {
          newCardX = windowWidth - cardWidth - 15;
        }

        if (newCardY < 0) {
          newCardY = 20;
        }

        setCardX(newCardX);
        setCardY(newCardY);
        setReady(true);
      };

      requestAnimationFrame(tryPosition);
    }, [rect, preferBelow]);

    return (
      <div
        ref={cardRef}
        className={`context-menu-container ${badgeInfoCardStyles.badgeInfoCard}`}
        style={{
          top: cardY,
          left: cardX,
          visibility: ready ? 'visible' : 'hidden',
        }}
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
