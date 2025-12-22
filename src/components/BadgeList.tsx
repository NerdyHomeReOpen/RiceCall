import React, { useMemo } from 'react';

import type * as Types from '@/types';

import BadgeItem from '@/components/BadgeItem';

import badgeStyle from '@/styles/badge.module.css';

interface BadgeListProps {
  badges: Types.Badge[];
  position?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  maxDisplay?: number;
  grid?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = React.memo(({ badges, position = 'left-top', direction = 'right-bottom', maxDisplay = 21, grid = false }) => {
  // Variables
  const filteredBadges = useMemo(() => badges.slice(0, maxDisplay).sort((a, b) => a.order - b.order), [badges, maxDisplay]);

  return (
    <div className={`${badgeStyle['badge-viewer-wrapper']} ${grid ? badgeStyle['grid'] : ''}`}>
      {filteredBadges.map((badge) => (
        <BadgeItem key={badge.badgeId} badge={badge} position={position} direction={direction} />
      ))}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

export default BadgeList;
