import React, { useState } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Actions from '@/action';

import SendSection from './SendSection';
import SentSection from './SentSection';
import EditSection from './EditSection';

interface ApplyMemberPopupProps {
  id: string;
  server: Types.Server;
  memberApplication: Types.MemberApplication | null;
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ id, server, memberApplication }) => {
  const [section, setSection] = useState<number>(memberApplication ? 1 : 0);
  const [applicationDesc, setApplicationDesc] = useState<Types.MemberApplication['description']>(memberApplication?.description || '');

  const isSendSection = section === 0;
  const isSentSection = section === 1;
  const isEditSection = section === 2;

  const handleApplicationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApplicationDesc(e.target.value);
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleServerNameLinkClick = () => {};

  const handleSubmitBtnClick = () => {
    Actions.sendMemberApplication(server.serverId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleSubmitEditBtnClick = () => {
    Actions.editMemberApplication(server.serverId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleConfirmBtnClick = () => {
    ipc.popup.close(id);
  };

  const handleCancelBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      {isSendSection && (
        <SendSection
          server={server}
          applicationDesc={applicationDesc}
          onServerNameLinkClick={handleServerNameLinkClick}
          onApplicationDescChange={handleApplicationDescChange}
          onSubmitBtnClick={handleSubmitBtnClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
      {isSentSection && <SentSection server={server} onServerNameLinkClick={handleServerNameLinkClick} onModifyBtnClick={handleModifyBtnClick} onConfirmBtnClick={handleConfirmBtnClick} />}
      {isEditSection && (
        <EditSection
          server={server}
          applicationDesc={applicationDesc}
          onServerNameLinkClick={handleServerNameLinkClick}
          onApplicationDescChange={handleApplicationDescChange}
          onSubmitBtnClick={handleSubmitEditBtnClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
    </div>
  );
});

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
