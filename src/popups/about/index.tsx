import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import packageJson from '../../../package.json';
import StaffCard from './StaffCard';

import * as ipc from '@/main/ipc';

import { useStaffList } from '@/hooks/useStaffList';

import MarkdownContent from '@/components/markdown-content';

type AboutPopupProps = Types.PopupProps<'aboutus'>;

const AboutPopup: React.FC<AboutPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();
  const { staffList } = useStaffList();
  const [shouldHideNextTime, setShouldHideNextTime] = useState(false);
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
    setShouldHideNextTime(e.target.checked);
  };

  const handleCloseBtnClick = () => {
    if (shouldHideNextTime) ipc.hideDisclaimerNextTime();
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-content" style={{ justifyContent: 'flex-start', gap: '10px' }}>
          <div className="self-center min-w-[226px] min-h-[54px] bg-[url('/login_logo.svg')] bg-no-repeat bg-center bg-cover" />
          <div className="flex flex-col items-start justify-center w-full">
            <div className="w-full pb-[5px] font-bold text-center">{`RiceCall v${packageJson.version}`}</div>
            <div className="w-full pb-[5px] text-center">{`COPYRIGHT @ ${currentYear} ricecall.com ,ALL RIGHTS RESERVED.`}</div>
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
          <div className="flex flex-col w-full min-h-fit p-[10px] border border-border">
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
