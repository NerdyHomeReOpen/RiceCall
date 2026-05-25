import React from 'react';

import type * as Types from '@/types';

import BadgeItem from '@/components/BadgeItem';

import styles from './BadgeList.module.css';

interface BadgeListProps {
  badges: Types.Badge[];
  position?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  maxDisplay?: number;
  grid?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = React.memo(({ badges, position = 'left-top', direction = 'right-bottom', maxDisplay = 21, grid = false }) => {
  const sortedBadges = badges
    .filter((b) => b.showTo <= 0 || b.showTo >= Date.now())
    .sort((a, b) => a.order - b.order)
    .slice(0, maxDisplay);

  return (
    <div className={`${styles['wrapper']} ${grid ? styles['grid'] : ''}`}>
      {sortedBadges.map((badge) => (
        <BadgeItem key={badge.badgeId} badge={badge} position={position} direction={direction} />
      ))}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

export default BadgeList;
