import React, { useState, useEffect, useRef } from 'react';

// CSS
import badgeInfoCardStyles from '@/styles/badgeInfoCard.module.css';

// Types
import type { Badge } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

interface BadgeInfoCardProps {
  badge: Badge;
  x?: number;
  y?: number;
  preferTop?: boolean;
  preferLeft?: boolean;
}

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(
  ({ x = 0, y = 0, preferTop = false, preferLeft = false, badge }) => {
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { t } = useTranslation();

    // State
    const [cardX, setCardX] = useState(0);
    const [cardY, setCardY] = useState(0);

    // Variables
    const badgeUrl = `/badge/${badge.badgeId.trim()}.png`;

    // Effect
    useEffect(() => {
      const positionCard = () => {
        if (!cardRef.current) return;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newPosX = x;
        let newPosY = y;

        const cardWidth = cardRef.current.offsetWidth;
        const cardHeight = cardRef.current.offsetHeight;
        const marginEdge = 10;

        if (cardWidth === 0 || cardHeight === 0) {
          return;
        }

        if (preferTop) {
          newPosY -= cardHeight;
        }

        if (preferLeft) {
          newPosX -= cardWidth;
        }

        if (newPosX + cardWidth + marginEdge > windowWidth) {
          newPosX = windowWidth - cardWidth - marginEdge;
        }
        if (newPosX < marginEdge) {
          newPosX = marginEdge;
        }
        if (newPosY + cardHeight + marginEdge > windowHeight) {
          newPosY = windowHeight - cardHeight - marginEdge;
        }
        if (newPosY < marginEdge) {
          newPosY = marginEdge;
        }

        setCardX(x);
        setCardY(y);
      };
      requestAnimationFrame(positionCard);
    }, [x, y, preferTop, preferLeft]);

    return (
      <div
        ref={cardRef}
        className={`context-menu-container ${badgeInfoCardStyles.badgeInfoCard}`}
        style={{
          top: cardY,
          left: cardX,
        }}
      >
        <div className={badgeInfoCardStyles.badgeInfoWrapper}>
          <div className={badgeInfoCardStyles.badgeAvatarBox}>
            <div className={badgeInfoCardStyles.badgeImage} style={{ backgroundImage: `url(${badgeUrl})` }} />
            <div className={badgeInfoCardStyles.badgeRarityText}>{`[${badge.rare}]`}</div>
          </div>
          <div className={badgeInfoCardStyles.badgeDescriptionBox}>
            <div className={badgeInfoCardStyles.badgeName}>{badge.name}</div>
            <div className={badgeInfoCardStyles.badgeDescription}>{badge.description}</div>
          </div>
        </div>
        <div className={badgeInfoCardStyles.badgeShowTimeBox}>
          <div>{t('showTo')}:</div>
          <div>1970-01-01</div>
        </div>
      </div>
    );
  },
);

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
