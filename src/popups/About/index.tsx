import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import packageJson from '../../../package.json';

import * as ipc from '@/main/ipc';

import { useStaffList } from '@/hooks/StaffList';

import StaffCard from './StaffCard';
import MarkdownContent from '@/components/MarkdownContent';

import styles from './About.module.css';

interface AboutPopupProps {
  id: string;
}

const AboutPopup: React.FC<AboutPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();
  const { staffList } = useStaffList();

  const [dontShowNextTime, setDontShowNextTime] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleGetHelpLinkClick = () => {
    window.open('https://discord.com/invite/adCWzv6wwS', '_blank');
  };

  const handleProjectRepoLinkClick = () => {
    window.open('https://github.com/NerdyHomeReOpen/RiceCall', '_blank');
  };

  const handleOfficialWebsiteLinkClick = () => {
    window.open('http://ricecall.com', '_blank');
  };

  const handleShowDisclaimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowNextTime(e.target.checked);
  };

  const handleCloseBtnClick = () => {
    if (dontShowNextTime) ipc.dontShowDisclaimerNextTime();
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-content" style={{ justifyContent: 'flex-start', gap: '10px' }}>
          <div className={styles['app-logo']} />
          <div className={styles['app-info']}>
            <div className={styles['app-version-text']}>{`RiceCall v${packageJson.version}`}</div>
            <div className={styles['copyright-text']}>{`COPYRIGHT @ ${currentYear} ricecall.com ,ALL RIGHTS RESERVED.`}</div>
            <div className="row" style={{ alignSelf: 'center' }}>
              <div className="link-text" onClick={handleGetHelpLinkClick}>
                {t('get-help')}
              </div>
              <div className="link-text" onClick={handleProjectRepoLinkClick}>
                {t('project-repo')}
              </div>
              <div className="link-text" onClick={handleOfficialWebsiteLinkClick}>
                {t('official-website')}
              </div>
            </div>
            <MarkdownContent markdownText={t('readme')} />
          </div>
          <div className={styles['team-members']}>
            <p>{t('team-members')}:</p>
            {staffList.map((staff) => (
              <StaffCard key={staff.contact} staff={staff} />
            ))}
          </div>
        </div>
      </div>
      <div className="popup-footer aboutFooter">
        <div className="input-box row" style={{ width: 'fit-content' }}>
          <input type="checkbox" name="showDisclaimer" onChange={handleShowDisclaimerChange} />
          <div className="label">{t('dont-show-next-time')}</div>
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

AboutPopup.displayName = 'AboutPopup';

export default AboutPopup;
