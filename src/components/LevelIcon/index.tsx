import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './LevelIcon.module.css';

interface LevelIconProps {
  level: number;
  xp: number;
  requiredXp: number;
  showTitle?: boolean;
}

const LevelIcon: React.FC<LevelIconProps> = React.memo(({ level, xp, requiredXp, showTitle = true }) => {
  const { t } = useTranslation();

  const title = showTitle ? `${t('level')}: ${level}, ${t('xp')}: ${xp}, ${t('required-xp')}: ${requiredXp - xp}` : '';

  return <div className={`${styles['grade']} ${styles[`lv-${Math.min(56, level)}`]}`} title={title} />;
});

LevelIcon.displayName = 'LevelIcon';

export default LevelIcon;
