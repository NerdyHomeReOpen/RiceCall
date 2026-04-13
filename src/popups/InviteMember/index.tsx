import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface InviteMemberPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  target: Types.Member;
  memberInvitation: Types.MemberInvitation | null;
}

const InviteMemberPopup: React.FC<InviteMemberPopupProps> = React.memo(({ id, serverId, target, memberInvitation }) => {
  const { t } = useTranslation();

  const [section, setSection] = useState<number>(memberInvitation ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [invitationDesc, setInvitationDesc] = useState<string>(memberInvitation?.description || '');

  const handleInvitationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInvitationDesc(e.target.value);
  };

  const handleSubmitBtnClick = () => {
    Actions.sendMemberInvitation(target.userId, serverId, { description: invitationDesc });
    handleCloseBtnClick();
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitEditBtnClick = () => {
    Actions.editMemberInvitation(target.userId, serverId, { description: invitationDesc });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="content col">
          <div className="label">{t('invite-member-label')}</div>
          <div className="row">
            <div className="avatar-wrapper">
              <div className="avatar-picture" style={{ backgroundImage: `url(${target.avatarUrl})` }} />
            </div>
            <div className="info-wrapper">
              <div className="link-text">
                {target.name} ({target.displayId})
              </div>
              <div className="sub-text">
                {t('contribution')}: {target.contribution}
              </div>
            </div>
          </div>
          <div className="split" />
          <div className="input-box col" style={section === 0 ? {} : { display: 'none' }}>
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={handleInvitationDescChange} />
          </div>
          <div className="hint-text" style={section === 1 ? {} : { display: 'none' }}>
            {t('member-invitation-sent')}
          </div>
          <div className="input-box col" style={section === 2 ? {} : { display: 'none' }}>
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={handleInvitationDescChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer" style={section === 0 ? {} : { display: 'none' }}>
        <div className="button" onClick={handleSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className="popup-footer" style={section === 1 ? {} : { display: 'none' }}>
        <div className="button" onClick={handleModifyBtnClick}>
          {t('modify')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className="popup-footer" style={section === 2 ? {} : { display: 'none' }}>
        <div className="button" onClick={handleSubmitEditBtnClick}>
          {t('submit')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
