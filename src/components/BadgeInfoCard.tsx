import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/badgeInfoCard.module.css';

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

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(({ x = 0, y = 0, preferTop = false, preferLeft = false, badge }) => {
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { t } = useTranslation();

  // State
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);

  // Effect
  useEffect(() => {
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

    setCardX(newPosX);
    setCardY(newPosY);
  }, [x, y, preferTop, preferLeft]);

  return (
    <div ref={cardRef} className={`badge-info-card-container user-info-card-container ${styles['badge-info-card']}`} style={{ top: cardY, left: cardX }}>
      <div className={styles['badge-info-wrapper']}>
        <div className={styles['badge-avatar-box']}>
          <div className={styles['badge-image']} style={{ backgroundImage: `url(${badge.iconUrl})` }} />
          {/* <div className={styles['badge-rarity-text']}>{`[${badge.rare}]`}</div> */}
        </div>
        <div className={styles['badge-description-box']}>
          <div className={styles['badge-name']}>{badge.name}</div>
          <div className={styles['badge-description']}>{badge.description}</div>
        </div>
      </div>
      <div className={styles['badge-show-time-box']}>
        <div>{t('show-to')}:</div>
        <div>1970-01-01</div>
      </div>
    </div>
  );
});

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
