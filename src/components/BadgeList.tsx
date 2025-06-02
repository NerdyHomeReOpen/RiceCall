import React from 'react';

// CSS
import styles from '@/styles/badge.module.css';

// Types
import type { Badge } from '@/types';

// Components
import BadgeItem from '@/components/BadgeItem';

interface BadgeListProps {
  badges: Badge[];
  maxDisplay?: number;
  preferTop?: boolean;
}

const BadgeList: React.FC<BadgeListProps> = React.memo(
  ({ badges, preferTop, maxDisplay = 21 }) => {
    const sortedBadges = [...badges]
      .sort((a, b) =>
        a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt,
      )
      .slice(0, maxDisplay);

    return (
      <div className={styles.badgeViewerWrapper}>
        {sortedBadges.map((badge) => (
          <BadgeItem key={badge.badgeId} badge={badge} preferTop={preferTop} />
        ))}
      </div>
    );
  },
);

BadgeList.displayName = 'BadgeList';

export default BadgeList;
