import React, { useState, useMemo } from 'react';
import { FaGithub, FaDiscord } from 'react-icons/fa';

// Package
import packageJson from '../../../package.json';
const version = packageJson.version;

// CSS
import styles from '@/styles/popups/about.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Services
import ipc from '@/services/ipc.service';

// Data
import { staff } from '@/staff';

const AboutPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [dontShowNextTime, setDontShowNextTime] = useState(false);

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  const handleDontShowNextTime = () => {
    ipc.systemSettings.disclaimer.dontShowNextTime();
  };

  // Memos
  const TITLE_COLOR_CLASSES: Record<string, string> = useMemo(
    () => ({
      [t('developer')]: styles['developer'],
      [t('developer')]: styles['developer'],
      [t('developer')]: styles['developer'],
      [t('developer')]: styles['developer'],
      [t('machine-network')]: styles['machine-network'],
      [t('technical-support')]: styles['technical-support'],
      [t('customer-service')]: styles['customer-service'],
    }),
    [t],
  );
  const CURRENT_YEAR = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className={`${popup['popup-wrapper']}`}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['content']} style={{ justifyContent: 'flex-start' }}>
          <div className={styles['app-logo']}></div>

          <div className={styles['app-info']}>
            <div className={styles['app-version-text']}>RiceCall v{version}</div>
            <div className={styles['copyright-text']}>COPYRIGHT @ {CURRENT_YEAR} RiceCall.com ,ALL RIGHTS RESERVED.</div>
            <div className={popup['row']} style={{ alignSelf: 'center' }}>
              <div className={popup['link-text']} onClick={() => ipc.window.openExternal('https://discord.com/invite/adCWzv6wwS')}>
                {t('get-help')}
              </div>
              <div className={popup['link-text']} onClick={() => ipc.window.openExternal('https://github.com/NerdyHomeReOpen/RiceCall')}>
                {t('project-repo')}
              </div>
              <div className={popup['link-text']} onClick={() => ipc.window.openExternal('http://ricecall.com.tw')}>
                {t('official-website')}
              </div>
            </div>
            <MarkdownContent markdownText={t('readme')} />
          </div>

          <div className={styles['team-members']}>
            <p>{t('team-members')}:</p>
            {staff.map((member, index) => {
              const githubInfo = member.github;
              const discordInfo = member.discord;
              return (
                <div key={index} className={styles['team-member-card']}>
                  <div className={styles['name-wrapper']}>
                    <span className={`${styles['developer-title']} ${TITLE_COLOR_CLASSES[t(member.title)]}`}>{t(member.title)}</span>
                    <span>{member.contact}</span>
                  </div>
                  <div className={styles['icon-wrapper']}>
                    {githubInfo && (
                      <div className={styles['github-icon-link']} title="GitHub" onClick={() => ipc.window.openExternal(`https://github.com/${githubInfo}`)}>
                        <FaGithub size={20} />
                      </div>
                    )}
                    {discordInfo && (
                      <div className={styles['discord-icon-link']} title="Discord" onClick={() => ipc.window.openExternal(`http://discordapp.com/users/${discordInfo}`)}>
                        <FaDiscord size={20} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${popup['popup-footer']} aboutFooter`}>
        <div className={`${popup['input-box']} ${popup['row']}`} style={{ width: 'fit-content' }}>
          <input type="checkbox" name="showDisclaimer" onChange={(e) => setDontShowNextTime(e.target.checked)} />
          <div className={popup['label']}>{t('dont-show-next-time')}</div>
        </div>
        <div
          className={popup['button']}
          onClick={() => {
            if (dontShowNextTime) handleDontShowNextTime();
            handleClose();
          }}
        >
          {t('close')}
        </div>
      </div>
    </div>
  );
});

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;
