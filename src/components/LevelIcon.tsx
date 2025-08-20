import React from 'react';

// CSS
import gradeStyle from '@/styles/grade.module.css';

// Providers
import { useTranslation } from 'react-i18next';

interface LevelIconProps {
  level: number;
  xp: number;
  requiredXp: number;
}

const LevelIcon: React.FC<LevelIconProps> = React.memo(({ level, xp, requiredXp }) => {
  // Hooks
  const { t } = useTranslation();

  return <div className={`${gradeStyle['grade']} ${gradeStyle[`lv-${Math.min(56, level)}`]}`} title={`${t('level')}: ${level}, ${t('xp')}: ${xp}, ${t('required-xp')}: ${requiredXp - xp}`} />;
});

LevelIcon.displayName = 'LevelIcon';

export default LevelIcon;
