import React, { useState } from 'react';
import { FaGithub, FaDiscord } from 'react-icons/fa';

// Package
import packageJson from '../../../package.json';
const version = packageJson.version;

// CSS
import popup from '@/styles/popup.module.css';
import aboutUs from '@/styles/popups/aboutUs.module.css';

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

  // Variables
  const titleColorClasses: Record<string, string> = {
    [t('mainDeveloper')]: aboutUs.mainDeveloper,
    [t('backendDeveloper')]: aboutUs.backendDeveloper,
    [t('frontendDeveloper')]: aboutUs.frontendDeveloper,
    [t('machineNetwork')]: aboutUs.machineNetwork,
    [t('technicalSupport')]: aboutUs.technicalSupport,
    [t('customerService')]: aboutUs.customerService,
  };
  const currentYear = new Date().getFullYear();
  const teamMembers = [
    {
      title: t('mainDeveloper'),
      contact: 'JoshHuang9508',
      info: [
        { label: 'Github', value: 'JoshHuang9508' },
        { label: 'Discord', value: '614396443016560649' },
      ],
    },
    {
      title: t('mainDeveloper'),
      contact: 'yeci226',
      info: [
        { label: 'Github', value: 'yeci226' },
        { label: 'Discord', value: '283946584461410305' },
      ],
    },
    {
      title: t('backendDeveloper'),
      contact: 'yuusukealmal',
      info: [
        { label: 'Github', value: 'yuusukealmal' },
        { label: 'Discord', value: '878830839822176287' },
      ],
    },
    {
      title: t('frontendDeveloper'),
      contact: 'cablate',
      info: [
        { label: 'Github', value: 'cablate' },
        { label: 'Discord', value: '337525692356886538' },
      ],
    },
    {
      title: t('frontendDeveloper'),
      contact: 'cstrikeasia',
      info: [
        { label: 'Github', value: 'cstrikeasia' },
        { label: 'Discord', value: '789742073036144640' },
      ],
    },
    {
      title: t('machineNetwork'),
      contact: 'Cooookie16',
      info: [
        { label: 'Github', value: 'Cooookie16' },
        { label: 'Discord', value: '370537724362620930' },
      ],
    },
    {
      title: t('machineNetwork'),
      contact: 'yayacat',
      info: [
        { label: 'Github', value: 'yayacat' },
        { label: 'Discord', value: '107918754251325440' },
      ],
    },
    {
      title: t('machineNetwork'),
      contact: 'codingbear',
      info: [
        { label: 'Github', value: 'mcg25035' },
        { label: 'Discord', value: '492908862647697409' },
      ],
    },
    {
      title: t('technicalSupport'),
      contact: 'orlys',
      info: [
        { label: 'Github', value: 'Orlys' },
        { label: 'Discord', value: '385825577698983937' },
      ],
    },
    {
      title: t('technicalSupport'),
      contact: '5026',
      info: [
        { label: 'Github', value: 'SN-Koarashi' },
        { label: 'Discord', value: '198418020329062400' },
      ],
    },
    {
      title: t('customerService'),
      contact: 'lingyu1121',
      info: [{ label: 'Discord', value: '371580417096155137' }],
    },
    {
      title: t('customerService'),
      contact: 'goujuanji_',
      info: [{ label: 'Discord', value: '415152218690420736' }],
    },
  ];

  return (
    <div className={`${popup['popupContainer']}`}>
      {/* Body */}
      <div className={`${popup['popupBody']} ${aboutUs['aboutContainer']}`}>
        <div className={aboutUs['contentBox']}>
          <div className={`${aboutUs['logoPlaceholder']}`}></div>

          <div className={aboutUs['appInfo']}>
            <div className={aboutUs['appInfoVersion']}>RiceCall v{version}</div>
            <div className={aboutUs['appInfoCopyright']}>
              COPYRIGHT @ {currentYear} RiceCall.com ,ALL RIGHTS RESERVED.
            </div>

            <MarkdownViewer markdownText={t('readmeContent')} />

            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal('https://discord.com/invite/adCWzv6wwS');
              }}
            >
              {t('getHelp')}
            </a>
            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal('https://github.com/NerdyHomeReOpen/RiceCall');
              }}
            >
              {t('projectRepo')}
            </a>
            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal('http://ricecall.com.tw');
              }}
            >
              {t('officialWebsite')}
            </a>
          </div>

          <div className={aboutUs['teamMembers']}>
            <p>{t('teamMembers')}:</p>
            {teamMembers.map((member, index) => {
              const githubInfo = member.info.find((item) => item.label === 'Github' && item.value);
              const discordInfo = member.info.find((item) => item.label === 'Discord' && item.value);
              return (
                <React.Fragment key={member.contact + index}>
                  <div className={aboutUs['teamMemberLink']}>
                    <div className={aboutUs['teamMemberNameGroup']}>
                      <span className={`${aboutUs['developerTitle']} ${titleColorClasses[member.title]}`}>
                        {member.title}
                      </span>
                      <span>{member.contact}</span>
                    </div>
                    <div className={aboutUs['iconGroup']}>
                      {githubInfo && (
                        <a
                          href={`https://github.com/${githubInfo.value}`}
                          target="_blank"
                          rel="noreferrer"
                          className={aboutUs['githubIconLink']}
                          title="GitHub"
                          onClick={(e) => {
                            e.preventDefault();
                            ipcService.window.openExternal(`https://github.com/${githubInfo.value}`);
                          }}
                        >
                          <FaGithub size={20} />
                        </a>
                      )}
                      {discordInfo && (
                        <a
                          href={`http://discordapp.com/users/${discordInfo.value}`}
                          target="_blank"
                          rel="noreferrer"
                          className={aboutUs.discordIconLink}
                          title="Discord"
                          onClick={(e) => {
                            e.preventDefault();
                            ipcService.window.openExternal(`http://discordapp.com/users/${discordInfo.value}`);
                          }}
                        >
                          <FaDiscord size={20} />
                        </a>
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
      <div className={`${popup['popupFooter']} aboutFooter`}>
        <div className={`${popup['inputBox']} ${popup['row']}`} style={{ width: 'fit-content' }}>
          <input
            type="checkbox"
            name="showDisclaimer"
            checked={dontShowNextTime}
            onChange={() => {
              setDontShowNextTime(!dontShowNextTime);
            }}
          />
          <div>
            <div className={popup['label']}>{t('dontShowNextTime')}</div>
          </div>
        </div>
        <button
          className={popup['button']}
          onClick={() => {
            if (dontShowNextTime) {
              ipcService.systemSettings.disclaimer.dontShowNextTime();
            }
            handleClose();
          }}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
});

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;
