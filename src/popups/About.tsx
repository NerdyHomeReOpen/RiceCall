import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaDiscord } from 'react-icons/fa';
import packageJson from '../../package.json' with { type: 'json' };
const version = packageJson.version;
import ipc from '@/ipc';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import styles from '@/styles/about.module.css';
import popupStyles from '@/styles/popup.module.css';

const AboutPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [dontShowNextTime, setDontShowNextTime] = useState(false);
  const [staffs, setStaffs] = useState<Types.Staff[]>([]);

  // Variables
  const currentYear = new Date().getFullYear();

  // Handlers
  const handleGetHelpLinkClick = () => {
    window.open('https://discord.com/invite/adCWzv6wwS', '_blank');
  };

  const handleProjectRepoLinkClick = () => {
    window.open('https://github.com/NerdyHomeReOpen/RiceCall', '_blank');
  };

  const handleOfficialWebsiteLinkClick = () => {
    window.open('http://ricecall.com.tw', '_blank');
  };

  const handleShowDisclaimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowNextTime(e.target.checked);
  };

  const handleCloseBtnClick = () => {
    if (dontShowNextTime) ipc.dontShowDisclaimerNextTime();
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    (async () => {
      const res = await fetch('https://nerdyhomereopen.github.io/Details/staff.json');
      if (!res.ok) return;
      const json = await res.json();
      setStaffs(json);
    })();
  }, []);

  return (
    <div className={`${popupStyles['popup-wrapper']}`}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['content']} style={{ justifyContent: 'flex-start' }}>
          <div className={styles['app-logo']} />
          <div className={styles['app-info']}>
            <div className={styles['app-version-text']}>{`RiceCall v${version}`}</div>
            <div className={styles['copyright-text']}>{`COPYRIGHT @ ${currentYear} RiceCall.com ,ALL RIGHTS RESERVED.`}</div>
            <div className={popupStyles['row']} style={{ alignSelf: 'center' }}>
              <div className={popupStyles['link-text']} onClick={handleGetHelpLinkClick}>
                {t('get-help')}
              </div>
              <div className={popupStyles['link-text']} onClick={handleProjectRepoLinkClick}>
                {t('project-repo')}
              </div>
              <div className={popupStyles['link-text']} onClick={handleOfficialWebsiteLinkClick}>
                {t('official-website')}
              </div>
            </div>
            <MarkdownContent markdownText={t('readme')} />
          </div>
          <div className={styles['team-members']}>
            <p>{t('team-members')}:</p>
            {staffs.map((staff) => (
              <StaffCard key={staff.contact} staff={staff} />
            ))}
          </div>
        </div>
      </div>
      <div className={`${popupStyles['popup-footer']} aboutFooter`}>
        <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
          <input type="checkbox" name="showDisclaimer" onChange={handleShowDisclaimerChange} />
          <div className={popupStyles['label']}>{t('dont-show-next-time')}</div>
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;

interface StaffCardProps {
  staff: Types.Staff;
}

const StaffCard: React.FC<StaffCardProps> = React.memo(({ staff }) => {
  // Hooks
  const { t } = useTranslation();

  // Functions
  const getTitleColorClass = (title: string) => {
    if (['project-owner'].some((t) => title.includes(t))) return styles['color-1'];
    if (['official-staff'].some((t) => title.includes(t))) return styles['color-2'];
    if (['developer', 'technical-support'].some((t) => title.includes(t))) return styles['color-3'];
    if (['machine-network'].some((t) => title.includes(t))) return styles['color-4'];
    return styles['color-5'];
  };

  // Handlers
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
