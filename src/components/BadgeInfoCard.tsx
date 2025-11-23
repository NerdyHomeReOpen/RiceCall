import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/badgeInfoCard.module.css';

// Types
import type { Badge } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

interface BadgeInfoCardProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  badge: Badge;
}

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(({ x, y, direction, badge }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);

  // Variables
  const { name: badgeName, description: badgeDescription, iconUrl: badgeIconUrl, showTo: badgeShowTo } = badge;

  // Effects
  useEffect(() => {
    if (!cardRef.current) return;
    const { offsetWidth: cardWidth, offsetHeight: cardHeight } = cardRef.current;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const marginEdge = 10;
    let newPosX = x;
    let newPosY = y;

    if (direction === 'left-top' || direction === 'right-top') {
      newPosY -= cardHeight;
    }
    if (direction === 'left-top' || direction === 'left-bottom') {
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
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={cardRef} className={`badge-info-card-container user-info-card-container ${styles['badge-info-card']}`} style={display ? { top: cardY, left: cardX } : { opacity: 0 }}>
      <div className={styles['badge-info-wrapper']}>
        <div className={styles['badge-avatar-box']}>
          <div className={styles['badge-image']} style={{ backgroundImage: `url(${badgeIconUrl})` }} />
          <div className={styles['badge-rarity-text']}>{`[${t('rare')}]`}</div>
        </div>
        <div className={styles['badge-description-box']}>
          <div className={styles['badge-name']}>{t(`${badgeName}`)}</div>
          <div className={styles['badge-description']}>{t(`${badgeDescription}`)}</div>
        </div>
      </div>
      <div className={styles['badge-show-time']}>{`${t('show-to')}: ${badgeShowTo <= 0 ? t('permanent') : new Date(badgeShowTo).toLocaleDateString()}`}</div>
    </div>
  );
});

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
