import React from 'react';
import { useTranslation } from 'react-i18next';

interface LevelIconProps {
  level: number;
  xp: number;
  requiredXp: number;
  showTooltip?: boolean;
}

const LevelIcon: React.FC<LevelIconProps> = React.memo(({ level, xp, requiredXp, showTooltip = true }) => {
  const { t } = useTranslation();

  const title = showTooltip ? `${t('level')}: ${level}, ${t('xp')}: ${xp}, ${t('required-xp')}: ${requiredXp - xp}` : '';

  // usergrade.svg is a 5-column sprite of 15px cells: level 1 is the first cell, levels above 56 use the last one.
  const spriteIndex = Math.max(0, Math.min(56, level) - 1);
  const backgroundPosition = `${-(spriteIndex % 5) * 15}px ${-Math.floor(spriteIndex / 5) * 15}px`;

  return <div className="w-[15px] min-w-[15px] h-[15px] min-h-[15px] bg-[url('/usergrade.svg')] bg-no-repeat bg-position-[0_0] bg-auto" style={{ backgroundPosition }} title={title} />;
});

LevelIcon.displayName = 'LevelIcon';

export default LevelIcon;
