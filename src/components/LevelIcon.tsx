import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from '@/styles/grade.module.css';

interface LevelIconProps {
  level: number;
  xp: number;
  requiredXp: number;
  showTooltip?: boolean;
}

const LevelIcon: React.FC<LevelIconProps> = React.memo(({ level, xp, requiredXp, showTooltip = true }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const title = showTooltip ? `${t('level')}: ${level}, ${t('xp')}: ${xp}, ${t('required-xp')}: ${requiredXp - xp}` : '';

  return <div className={`${styles['grade']} ${styles[`lv-${Math.min(56, level)}`]}`} title={title} />;
});

LevelIcon.displayName = 'LevelIcon';

export default LevelIcon;
