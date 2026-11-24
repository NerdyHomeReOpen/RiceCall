import React from 'react';

import type * as Types from '@/types';

import BadgeItem from '@/components/badge-item';

interface BadgeListProps {
  badges: Types.Badge[];
  position?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  maxDisplay?: number;
  grid?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = React.memo(({ badges, position = 'left-top', direction = 'right-bottom', maxDisplay = 21, grid = false }) => {
  const sortedBadges = badges
    .filter((b) => b.showEndsAt <= 0 || b.showEndsAt >= Date.now())
    .sort((a, b) => a.order - b.order)
    .slice(0, maxDisplay);

  return (
    <div className={`gap-[2px] ${grid ? 'grid grid-cols-[repeat(auto-fill,minmax(17px,1fr))] auto-rows-[17px] w-full' : 'flex'}`}>
      {sortedBadges.map((badge) => (
        <BadgeItem key={badge.badgeId} badge={badge} position={position} direction={direction} />
      ))}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

export default BadgeList;
