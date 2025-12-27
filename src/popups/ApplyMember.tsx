import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface ApplyMemberPopupProps {
  server: Types.Server;
  memberApplication: Types.MemberApplication | null;
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ server, memberApplication }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(memberApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [applicationDesc, setApplicationDesc] = useState<Types.MemberApplication['description']>(memberApplication?.description || '');

  // Variables
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, specialId: serverSpecialId, displayId: serverDisplayId, applyNotice: serverApplyNotice } = server;

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']}>{serverName}</div>
              <div className={popupStyles['sub-text']}>{`ID: ${serverSpecialId || serverDisplayId}`}</div>
            </div>
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('apply-member-note')}</div>
            <div className={popupStyles['hint-text']}>{serverApplyNotice || t('none')}</div>
          </div>
          <div className={popupStyles['split']} />
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
          <div className={popupStyles['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-application-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div
          className={popupStyles['button']}
          onClick={() => {
            Popup.sendMemberApplication(serverId, { description: applicationDesc });
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
          {t('confirm')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div
          className={popupStyles['button']}
          onClick={() => {
            Popup.editMemberApplication(serverId, { description: applicationDesc });
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

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
