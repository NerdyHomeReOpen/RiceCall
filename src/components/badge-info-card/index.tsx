import React, { useState, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

interface BadgeInfoCardProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  badge: Types.Badge;
}

const BadgeInfoCard: React.FC<BadgeInfoCardProps> = React.memo(({ x, y, direction, badge }) => {
  const { t } = useTranslation();

  const cardRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);

  const isPermanent = badge.showEndsAt <= 0;

  useLayoutEffect(() => {
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
    setIsVisible(true);
  }, [x, y, direction]);

  return (
    <div
      ref={cardRef}
      className={`badge-info-card-container user-info-card-container fixed z-10000 flex flex-col gap-[10px] items-center w-[300px] min-h-[145px] p-[10px] bg-background-secondary border border-border`}
      style={isVisible ? { top: cardY, left: cardX } : { opacity: 0 }}
    >
      <div className="flex flex-1 flex-row gap-[10px] items-start w-full">
        <div className="flex flex-col items-center max-w-[75px]">
          <Image src={badge.iconUrl} alt="badge_icon" width={64} height={64} loading="lazy" draggable="false" />
          <div className="mt-[8px] text-text-vip-name">{`[${t('rare')}]`}</div>
        </div>
        <div className="flex flex-col gap-[10px] items-start justify-start w-full h-full ml-[10px]">
          <div className="text-[1.1em] font-bold text-text-color-quaternary">{t(badge.name)}</div>
          <div className="text-text-color-quaternary">{t(badge.description, { nickname: badge.displayNickname })}</div>
        </div>
      </div>
      <div className="w-full text-text-color-quaternary">{t('show-to', { '0': isPermanent ? t('permanent') : new Date(badge.showEndsAt).toLocaleDateString() })}</div>
    </div>
  );
});

BadgeInfoCard.displayName = 'BadgeInfoCard';

export default BadgeInfoCard;
