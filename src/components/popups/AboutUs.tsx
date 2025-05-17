import React from 'react';
import packageJson from '../../../package.json';
const version = packageJson.version;
import { FaGithub, FaDiscord } from 'react-icons/fa';

// CSS
import popup from '@/styles/popup.module.css';
import aboutUs from '@/styles/popups/aboutUs.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

const AboutPopup: React.FC = () => {
  // Language
  const lang = useLanguage();

  // Handle
  const handleClose = () => {
    ipcService.window.close();
  };

  // Types
  type JobTitle =
    | typeof lang.tr.mainDeveloper
    | typeof lang.tr.backendDeveloper
    | typeof lang.tr.frontendDeveloper
    | typeof lang.tr.serverMaintainer
    | typeof lang.tr.technicalSupport;

  const titleColorClasses: Record<JobTitle, string> = {
    [lang.tr.mainDeveloper]: aboutUs.mainDeveloper,
    [lang.tr.backendDeveloper]: aboutUs.backendDeveloper,
    [lang.tr.frontendDeveloper]: aboutUs.frontendDeveloper,
    [lang.tr.serverMaintainer]: aboutUs.serverMaintainer,
    [lang.tr.technicalSupport]: aboutUs.technicalSupport,
  };
  const currentYear = new Date().getFullYear();
  const teamMembers = [
    {
      title: lang.tr.mainDeveloper,
      contact: 'JoshHuang9508',
      info: [
        { label: 'Github', value: 'JoshHuang9508' },
        { label: 'Discord', value: '614396443016560649' },
      ],
    },
    {
      title: lang.tr.mainDeveloper,
      contact: 'yeci226',
      info: [
        { label: 'Github', value: 'yeci226' },
        { label: 'Discord', value: '283946584461410305' },
      ],
    },
    {
      title: lang.tr.backendDeveloper,
      contact: 'lekoOwO',
      info: [
        { label: 'Github', value: 'lekoOwO' },
        { label: 'Discord', value: '108153734541942784' },
      ],
    },
    {
      title: lang.tr.frontendDeveloper,
      contact: 'cablate',
      info: [
        { label: 'Github', value: 'cablate' },
        { label: 'Discord', value: '337525692356886538' },
      ],
    },
    {
      title: lang.tr.frontendDeveloper,
      contact: 'cstrikeasia',
      info: [
        { label: 'Github', value: 'cstrikeasia' },
        { label: 'Discord', value: '789742073036144640' },
      ],
    },
    {
      title: lang.tr.serverMaintainer,
      contact: 'Cooookie16',
      info: [
        { label: 'Github', value: 'Cooookie16' },
        { label: 'Discord', value: '370537724362620930' },
      ],
    },
    {
      title: lang.tr.serverMaintainer,
      contact: 'yayacat',
      info: [
        { label: 'Github', value: 'yayacat' },
        { label: 'Discord', value: '107918754251325440' },
      ],
    },
    {
      title: lang.tr.technicalSupport,
      contact: 'orlys',
      info: [
        { label: 'Github', value: 'Orlys' },
        { label: 'Discord', value: '385825577698983937' },
      ],
    },
    {
      title: lang.tr.technicalSupport,
      contact: '5026',
      info: [
        { label: 'Github', value: 'SN-Koarashi' },
        { label: 'Discord', value: '198418020329062400' },
      ],
    },
  ];

  return (
    <div className={`${popup['popupContainer']}`}>
      <div className={`${popup['popupBody']} ${aboutUs['aboutContainer']}`}>
        <div className={`${aboutUs['logoArea']}`}>
          <div className={`${aboutUs['logoPlaceholder']}`}></div>
        </div>

        <div className={aboutUs['contentBox']}>
          <div className={aboutUs['appInfo']}>
            <p className={aboutUs['appInfoVersion']}>RiceCall {version}</p>
            <p className={aboutUs['appInfoCopyright']}>
              COPYRIGHT @ {currentYear} RiceCall.com ,ALL RIGHTS RESERVED.
            </p>
            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal(
                  'https://discord.com/invite/adCWzv6wwS',
                );
              }}
            >
              {lang.tr.getHelp}
            </a>
            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal(
                  'https://github.com/NerdyHomeReOpen/RiceCall',
                );
              }}
            >
              {lang.tr.projectRepo}
            </a>
            <a
              className={aboutUs['websiteLink']}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ipcService.window.openExternal('http://ricecall.com.tw');
              }}
            >
              {lang.tr.officialWebsite}
            </a>
          </div>
          <div className={aboutUs['teamMembers']}>
            <p>{lang.tr.teamMembers}:</p>
            {teamMembers.map((member, index) => {
              const githubInfo = member.info.find(
                (item) => item.label === 'Github' && item.value,
              );
              const discordInfo = member.info.find(
                (item) => item.label === 'Discord' && item.value,
              );
              return (
                <React.Fragment key={member.contact + index}>
                  <div className={aboutUs['teamMemberLink']}>
                    <div className={aboutUs['teamMemberNameGroup']}>
                      <span
                        className={`${aboutUs['developerTitle']} ${
                          titleColorClasses[member.title as JobTitle]
                        }`}
                      >
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
                            ipcService.window.openExternal(
                              `https://github.com/${githubInfo.value}`,
                            );
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
                            ipcService.window.openExternal(
                              `http://discordapp.com/users/${discordInfo.value}`,
                            );
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

      <div className={`${popup['popupFooter']} aboutFooter`}>
        <button className={popup['button']} onClick={handleClose}>
          {lang.tr.close}
        </button>
      </div>
    </div>
  );
};

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;
