import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaDiscord } from 'react-icons/fa';

import type * as Types from '@/types';

interface StaffCardProps {
  staff: Types.Staff;
}

const StaffCard: React.FC<StaffCardProps> = React.memo(({ staff }) => {
  const { t } = useTranslation();

  const getTitleColorClass = (title: string) => {
    if (['project-owner'].some((t) => title.includes(t))) return 'bg-[rgb(216_63_63/80%)]';
    if (['official-staff'].some((t) => title.includes(t))) return 'bg-[rgb(77_173_147/80%)]';
    if (['developer', 'technical-support'].some((t) => title.includes(t))) return 'bg-[rgb(216_166_63/80%)]';
    if (['machine-network'].some((t) => title.includes(t))) return 'bg-[rgb(63_166_216/80%)]';
    return 'bg-[rgb(115_164_213/70%)]';
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
    <div className="flex items-center justify-between w-full p-[3px] mt-[3px] bg-transparent border border-border rounded-[5px] backdrop-blur-[5px] transition-[background-color] duration-300 ease-[ease] hover:bg-hover">
      <div className="flex items-center leading-[1.4]">
        <span className={`inline-block min-w-[80px] py-[4px] px-[8px] mr-[8px] font-bold text-white text-center rounded-[4px] ${getTitleColorClass(staff.title)}`}>
          {t(staff.title, { ns: 'position' })}
        </span>
        <span>{staff.contact}</span>
        {staff.ricecall && (
          <div className="inline-block mr-[8px] text-text-link text-center select-text" title="RiceCall" onClick={handleRiceCallIdClick}>
            (@{staff.ricecall})
          </div>
        )}
      </div>
      <div className="flex gap-[10px] items-center [&_svg]:align-middle [&_svg]:transition-[color] [&_svg]:duration-300 [&_svg]:ease-[ease]">
        {staff.github && (
          <div className="hover:[&_svg]:text-[rgb(70_70_70)]" title="GitHub" onClick={handleGitHubIconClick}>
            <FaGithub size={20} />
          </div>
        )}
        {staff.discord && (
          <div className="hover:[&_svg]:text-[#7289da]" title="Discord" onClick={handleDiscordIconClick}>
            <FaDiscord size={20} />
          </div>
        )}
      </div>
    </div>
  );
});

StaffCard.displayName = 'StaffCard';

export default StaffCard;
