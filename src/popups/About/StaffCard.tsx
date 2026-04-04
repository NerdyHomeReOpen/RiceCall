import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaDiscord } from 'react-icons/fa';

import type * as Types from '@/types';

import styles from './About.module.css';

interface StaffCardProps {
  staff: Types.Staff;
}

const StaffCard: React.FC<StaffCardProps> = React.memo(({ staff }) => {
  const { t } = useTranslation();

  const getTitleColorClass = (title: string) => {
    if (['project-owner'].some((t) => title.includes(t))) return styles['color-1'];
    if (['official-staff'].some((t) => title.includes(t))) return styles['color-2'];
    if (['developer', 'technical-support'].some((t) => title.includes(t))) return styles['color-3'];
    if (['machine-network'].some((t) => title.includes(t))) return styles['color-4'];
    return styles['color-5'];
  };

  const handleRiceCallIdClick = () => {
    navigator.clipboard.writeText(staff.ricecall);
  };

  const handleDiscordIconClick = () => {
    window.open(`http://discordapp.com/users/${staff.discord}`, '_blank');
  };

  const handleGitHubIconClick = () => {
    window.open(`https://github.com/${staff.github}`, '_blank');
  };

  return (
    <div className={styles['team-member-card']}>
      <div className={styles['name-wrapper']}>
        <span className={`${styles['staff-title']} ${getTitleColorClass(staff.title)}`}>{t(staff.title, { ns: 'position' })}</span>
        <span>{staff.contact}</span>
        {staff.ricecall && (
          <div className={styles['ricecall-id']} title="RiceCall" onClick={handleRiceCallIdClick}>
            (@{staff.ricecall})
          </div>
        )}
      </div>
      <div className={styles['icon-wrapper']}>
        {staff.github && (
          <div className={styles['github-icon-link']} title="GitHub" onClick={handleGitHubIconClick}>
            <FaGithub size={20} />
          </div>
        )}
        {staff.discord && (
          <div className={styles['discord-icon-link']} title="Discord" onClick={handleDiscordIconClick}>
            <FaDiscord size={20} />
          </div>
        )}
      </div>
    </div>
  );
});

StaffCard.displayName = 'StaffCard';

export default StaffCard;
