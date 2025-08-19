import React from 'react';

// CSS
import styles from '@/styles/badge.module.css';

// Types
import type { Badge } from '@/types';

// Components
import BadgeItem from '@/components/BadgeItem';

interface BadgeListProps {
  badges: Badge[];
  position?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  direction?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  maxDisplay?: number;
}

const BadgeList: React.FC<BadgeListProps> = React.memo(({ badges, position = 'left-top', direction = 'right-bottom', maxDisplay = 21 }) => {
  // Variables
  const sortedBadges = [...badges].sort((a, b) => a.order - b.order).slice(0, maxDisplay);

  return (
    <div className={styles['badge-viewer-wrapper']}>
      {sortedBadges.map((badge) => (
        <BadgeItem key={badge.badgeId} badge={badge} position={position} direction={direction} />
      ))}
    </div>
  );
});

BadgeList.displayName = 'BadgeList';

export default BadgeList;
