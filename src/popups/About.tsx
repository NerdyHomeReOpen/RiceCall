import React, { useState, useEffect } from 'react';
import { FaGithub, FaDiscord } from 'react-icons/fa';

// Package
import packageJson from '../../package.json';
const version = packageJson.version;

// CSS
import styles from '@/styles/about.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Services
import ipc from '@/ipc';

type Staff = {
  title: string;
  contact: string;
  github: string;
  discord: string;
  ricecall: string;
  email: string;
};

const AboutPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [dontShowNextTime, setDontShowNextTime] = useState(false);
  const [staffs, setStaffs] = useState<Staff[]>([]);

  // Variables
  const currentYear = new Date().getFullYear();

  // Handlers
  const handleDontShowNextTime = () => {
    ipc.dontShowDisclaimerNextTime();
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const getTitleColorClass = (title: string) => {
    if (['project-owner'].some((t) => title.includes(t))) return styles['color-1'];
    if (['official-staff'].some((t) => title.includes(t))) return styles['color-2'];
    if (['developer', 'technical-support'].some((t) => title.includes(t))) return styles['color-3'];
    if (['machine-network'].some((t) => title.includes(t))) return styles['color-4'];
    return styles['color-5'];
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
    <div className={`${popup['popup-wrapper']}`}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['content']} style={{ justifyContent: 'flex-start' }}>
          <div className={styles['app-logo']}></div>

          <div className={styles['app-info']}>
            <div className={styles['app-version-text']}>RiceCall v{version}</div>
            <div className={styles['copyright-text']}>COPYRIGHT @ {currentYear} RiceCall.com ,ALL RIGHTS RESERVED.</div>
            <div className={popup['row']} style={{ alignSelf: 'center' }}>
              <div className={popup['link-text']} onClick={() => window.open('https://discord.com/invite/adCWzv6wwS', '_blank')}>
                {t('get-help')}
              </div>
              <div className={popup['link-text']} onClick={() => window.open('https://github.com/NerdyHomeReOpen/RiceCall', '_blank')}>
                {t('project-repo')}
              </div>
              <div className={popup['link-text']} onClick={() => window.open('http://ricecall.com.tw', '_blank')}>
                {t('official-website')}
              </div>
            </div>
            <MarkdownContent markdownText={t('readme')} />
          </div>

          <div className={styles['team-members']}>
            <p>{t('team-members')}:</p>
            {staffs.map((staff, index) => (
              <div key={index} className={styles['team-member-card']}>
                <div className={styles['name-wrapper']}>
                  <span className={`${styles['staff-title']} ${getTitleColorClass(staff.title)}`}>{t(staff.title, { ns: 'position' })}</span>
                  <span>{staff.contact}</span>
                </div>
                <div className={styles['icon-wrapper']}>
                  {staff.ricecall && (
                    <div className={styles['ricecall-id']} title="RiceCall" onClick={() => navigator.clipboard.writeText(staff.ricecall)}>
                      @{staff.ricecall}
                    </div>
                  )}
                  {staff.github && (
                    <div className={styles['github-icon-link']} title="GitHub" onClick={() => window.open(`https://github.com/${staff.github}`, '_blank')}>
                      <FaGithub size={20} />
                    </div>
                  )}
                  {staff.discord && (
                    <div className={styles['discord-icon-link']} title="Discord" onClick={() => window.open(`http://discordapp.com/users/${staff.discord}`, '_blank')}>
                      <FaDiscord size={20} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${popup['popup-footer']} aboutFooter`}>
        <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
          <input type="checkbox" name="showDisclaimer" onChange={(e) => setDontShowNextTime(e.target.checked)} />
          <div className={popup['label']}>{t('dont-show-next-time')}</div>
        </div>
        <div className={popup['button']} onClick={() => (dontShowNextTime ? handleDontShowNextTime() : handleClose())}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;
