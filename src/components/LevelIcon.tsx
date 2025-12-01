import React from 'react';

// CSS
import gradeStyle from '@/styles/grade.module.css';

// Providers
import { useTranslation } from 'react-i18next';

interface LevelIconProps {
  level: number;
  xp: number;
  requiredXp: number;
  isSelf?: boolean;
  isHover?: boolean;
}

const LevelIcon: React.FC<LevelIconProps> = React.memo(({ level, xp, requiredXp, isSelf, isHover }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const title = isSelf ? `${t('level')}: ${level}, ${t('xp')}: ${xp}, ${t('required-xp')}: ${requiredXp - xp}` : isHover ? `${t('level')}: ${level}` : '';

  return <div className={`${isHover && gradeStyle['grade-hover']} ${gradeStyle['grade']} ${gradeStyle[`lv-${Math.min(56, level)}`]}`} title={title} />;
});

LevelIcon.displayName = 'LevelIcon';

export default LevelIcon;
