import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface InviteMemberPopupProps {
  serverId: Types.Server['serverId'];
  target: Types.Member;
  memberInvitation: Types.MemberInvitation | null;
}

const InviteMemberPopup: React.FC<InviteMemberPopupProps> = React.memo(({ serverId, target, memberInvitation }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(memberInvitation ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [invitationDesc, setInvitationDesc] = useState<string>(memberInvitation?.description || '');

  // Handlers
  const handleInvitationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInvitationDesc(e.target.value);
  };

  const handleSubmitBtnClick = () => {
    Popup.sendMemberInvitation(target.userId, serverId, { description: invitationDesc });
    handleCloseBtnClick();
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitEditBtnClick = () => {
    Popup.editMemberInvitation(target.userId, serverId, { description: invitationDesc });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['label']}>{t('invite-member-label')}</div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${target.avatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']}>
                {target.name} ({target.displayId})
              </div>
              <div className={popupStyles['sub-text']}>
                {t('contribution')}: {target.contribution}
              </div>
            </div>
          </div>
          <div className={popupStyles['split']} />
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={handleInvitationDescChange} />
          </div>
          <div className={popupStyles['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-invitation-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={handleInvitationDescChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleModifyBtnClick}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleSubmitEditBtnClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
