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

  // Variables
  const { userId: targetId, name: targetName, avatarUrl: targetAvatarUrl, displayId: targetDisplayId, contribution: targetContribution } = target;

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['label']}>{t('invite-member-label')}</div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']}>
                {targetName} ({targetDisplayId})
              </div>
              <div className={popupStyles['sub-text']}>
                {t('contribution')}: {targetContribution}
              </div>
            </div>
          </div>
          <div className={popupStyles['split']} />
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={(e) => setInvitationDesc(e.target.value)} />
          </div>
          <div className={popupStyles['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-invitation-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={(e) => setInvitationDesc(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div
          className={popupStyles['button']}
          onClick={() => {
            Popup.sendMemberInvitation(targetId, serverId, { description: invitationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={() => setSection(2)}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div
          className={popupStyles['button']}
          onClick={() => {
            Popup.editMemberInvitation(targetId, serverId, { description: invitationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
