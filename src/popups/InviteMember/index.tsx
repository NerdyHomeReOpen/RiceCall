import React, { useState } from 'react';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import { sendMemberInvitation, editMemberInvitation } from '@/services';

import SendSection from './SendSection';
import SentSection from './SentSection';
import EditSection from './EditSection';

interface InviteMemberPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  receiverMember: Types.Member;
  memberInvitation: Types.MemberInvitation | null;
}

const InviteMemberPopup: React.FC<InviteMemberPopupProps> = React.memo(({ id, serverId, receiverMember, memberInvitation }) => {
  const [section, setSection] = useState<number>(memberInvitation ? 1 : 0);
  const [invitationDesc, setInvitationDesc] = useState<string>(memberInvitation?.description || '');

  const isSendSection = section === 0;
  const isSentSection = section === 1;
  const isEditSection = section === 2;

  const handleInvitationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInvitationDesc(e.target.value);
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitBtnClick = () => {
    sendMemberInvitation(receiverMember.userId, serverId, { description: invitationDesc });
    ipc.popup.close(id);
  };

  const handleSubmitEditBtnClick = () => {
    editMemberInvitation(receiverMember.userId, serverId, { description: invitationDesc });
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
          receiverMember={receiverMember}
          invitationDesc={invitationDesc}
          onInvitationDescChange={handleInvitationDescChange}
          onSubmitBtnClick={handleSubmitBtnClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
      {isSentSection && <SentSection receiverMember={receiverMember} onModifyBtnClick={handleModifyBtnClick} onConfirmBtnClick={handleConfirmBtnClick} />}
      {isEditSection && (
        <EditSection
          receiverMember={receiverMember}
          invitationDesc={invitationDesc}
          onInvitationDescChange={handleInvitationDescChange}
          onSubmitBtnClick={handleSubmitEditBtnClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
