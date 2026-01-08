import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import styles from '@/styles/badgeInfoCard.module.css';

export interface BadgeInfoCardProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  badge: Types.Badge;
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
  const { name: badgeName, description: badgeDescription, iconUrl: badgeIconUrl, showTo: badgeShowTo, displayNickname: badgeDisplayNickname } = badge;
  const isPermanent = badgeShowTo <= 0;

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
          <Image src={badgeIconUrl} alt={badgeName} width={64} height={64} loading="lazy" draggable="false" />
          <div className={styles['badge-rarity-text']}>{`[${t('rare')}]`}</div>
        </div>
        <div className={styles['badge-description-box']}>
          <div className={styles['badge-name']}>{t(badgeName)}</div>
          <div className={styles['badge-description']}>{t(badgeDescription, { nickname: badgeDisplayNickname })}</div>
        </div>
      </div>
      <div className={styles['badge-show-time']}>{t('show-to', { '0': isPermanent ? t('permanent') : new Date(badgeShowTo).toLocaleDateString() })}</div>
    </div>
  );
});

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
