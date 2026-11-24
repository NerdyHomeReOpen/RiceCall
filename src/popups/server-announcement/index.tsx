import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/announcement-editor';

type ServerAnnouncementPopupProps = Types.PopupProps<'serverAnnouncement'>;

const ServerAnnouncementPopup: React.FC<ServerAnnouncementPopupProps> = React.memo(({ id, serverAnnouncement }) => {
  const { t } = useTranslation();

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div data-draggable className="popup-wrapper">
      <div className="relative flex flex-row items-center justify-between bg-footer-background [-webkit-app-region:drag]">
        <div className="flex flex-row mt-[5px] ml-[10px]">
          <span className="px-[30px] py-[5px] text-[14px] bg-background border-t border-x border-t-border border-x-border rounded-t-[5px]">{t('announcement')}</span>
        </div>
        <div className="flex items-center justify-center p-[10px] [-webkit-app-region:no-drag]">
          <div
            className="block w-[14px] h-[14px] cursor-pointer bg-[url('/im/btn-close.svg')] bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-14px_0] active:bg-position-[-28px_0]"
            onClick={handleCloseBtnClick}
          />
        </div>
      </div>
      <div>
        <AnnouncementEditor announcement={serverAnnouncement} showPreview={true} onChange={() => {}} />
      </div>
    </div>
  );
});

ServerAnnouncementPopup.displayName = 'ServerAnnouncementPopup';

export default ServerAnnouncementPopup;
