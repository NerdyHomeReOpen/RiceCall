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
import MarkdownViewer from '@/components/MarkdownViewer';

// Services
import ipcService from '@/services/ipc.service';

const AboutPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [dontShowNextTime, setDontShowNextTime] = useState(false);

  // Handlers
  const handleClose = () => {
    ipcService.window.close();
  };

  const handleDontShowNextTime = () => {
    ipcService.systemSettings.disclaimer.dontShowNextTime();
  };

  // Memos
  const TITLE_COLOR_CLASSES: Record<string, string> = useMemo(
    () => ({
      [t('main-developer')]: styles['main-developer'],
      [t('backend-developer')]: styles['backend-developer'],
      [t('frontend-developer')]: styles['frontend-developer'],
      [t('machine-network')]: styles['machine-network'],
      [t('technical-support')]: styles['technical-support'],
      [t('customer-service')]: styles['customer-service'],
    }),
    [t],
  );
  const CURRENT_YEAR = useMemo(() => new Date().getFullYear(), []);
  const TEAM_MEMBERS = useMemo(
    () => [
      {
        title: t('main-developer'),
        contact: 'JoshHuang9508',
        info: [
          { label: 'Github', value: 'JoshHuang9508' },
          { label: 'Discord', value: '614396443016560649' },
        ],
      },
      {
        title: t('main-developer'),
        contact: 'yeci226',
        info: [
          { label: 'Github', value: 'yeci226' },
          { label: 'Discord', value: '283946584461410305' },
        ],
      },
      {
        title: t('backend-developer'),
        contact: 'yuusukealmal',
        info: [
          { label: 'Github', value: 'yuusukealmal' },
          { label: 'Discord', value: '878830839822176287' },
        ],
      },
      {
        title: t('frontend-developer'),
        contact: 'cablate',
        info: [
          { label: 'Github', value: 'cablate' },
          { label: 'Discord', value: '337525692356886538' },
        ],
      },
      {
        title: t('frontend-developer'),
        contact: 'cstrikeasia',
        info: [
          { label: 'Github', value: 'cstrikeasia' },
          { label: 'Discord', value: '789742073036144640' },
        ],
      },
      {
        title: t('machine-network'),
        contact: 'Cooookie16',
        info: [
          { label: 'Github', value: 'Cooookie16' },
          { label: 'Discord', value: '370537724362620930' },
        ],
      },
      {
        title: t('machine-network'),
        contact: 'yayacat',
        info: [
          { label: 'Github', value: 'yayacat' },
          { label: 'Discord', value: '107918754251325440' },
        ],
      },
      {
        title: t('machine-network'),
        contact: 'codingbear',
        info: [
          { label: 'Github', value: 'mcg25035' },
          { label: 'Discord', value: '492908862647697409' },
        ],
      },
      {
        title: t('technical-support'),
        contact: 'orlys',
        info: [
          { label: 'Github', value: 'Orlys' },
          { label: 'Discord', value: '385825577698983937' },
        ],
      },
      {
        title: t('technical-support'),
        contact: '5026',
        info: [
          { label: 'Github', value: 'SN-Koarashi' },
          { label: 'Discord', value: '198418020329062400' },
        ],
      },
      {
        title: t('customer-service'),
        contact: 'lingyu1121',
        info: [{ label: 'Discord', value: '371580417096155137' }],
      },
      {
        title: t('customer-service'),
        contact: 'goujuanji_',
        info: [{ label: 'Discord', value: '415152218690420736' }],
      },
    ],
    [t],
  );

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
              <div className={popup['link-text']} onClick={() => ipcService.window.openExternal('https://discord.com/invite/adCWzv6wwS')}>
                {t('get-help')}
              </div>
              <div className={popup['link-text']} onClick={() => ipcService.window.openExternal('https://github.com/NerdyHomeReOpen/RiceCall')}>
                {t('project-repo')}
              </div>
              <div className={popup['link-text']} onClick={() => ipcService.window.openExternal('http://ricecall.com.tw')}>
                {t('official-website')}
              </div>
            </div>
            <MarkdownViewer markdownText={t('readme')} />
          </div>

          <div className={styles['team-members']}>
            <p>{t('team-members')}:</p>
            {TEAM_MEMBERS.map((member, index) => {
              const githubInfo = member.info.find((item) => item.label === 'Github' && item.value);
              const discordInfo = member.info.find((item) => item.label === 'Discord' && item.value);
              return (
                <React.Fragment key={member.contact + index}>
                  <div className={styles['team-member-card']}>
                    <div className={styles['name-wrapper']}>
                      <span className={`${styles['developer-title']} ${TITLE_COLOR_CLASSES[member.title]}`}>{member.title}</span>
                      <span>{member.contact}</span>
                    </div>
                    <div className={styles['icon-wrapper']}>
                      {githubInfo && (
                        <div className={styles['github-icon-link']} title="GitHub" onClick={() => ipcService.window.openExternal(`https://github.com/${githubInfo.value}`)}>
                          <FaGithub size={20} />
                        </div>
                      )}
                      {discordInfo && (
                        <div className={styles['discord-icon-link']} title="Discord" onClick={() => ipcService.window.openExternal(`http://discordapp.com/users/${discordInfo.value}`)}>
                          <FaDiscord size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
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
