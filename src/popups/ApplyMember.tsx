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
  const isSendSection = section === 0;
  const isSentSection = section === 1;
  const isEditSection = section === 2;

  // Handlers
  const handleApplicationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApplicationDesc(e.target.value);
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitBtnClick = () => {
    Popup.sendMemberApplication(serverId, { description: applicationDesc });
    ipc.window.close();
  };

  const handleSubmitEditBtnClick = () => {
    Popup.editMemberApplication(serverId, { description: applicationDesc });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
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
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={isSendSection ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
          <div className={popupStyles['hint-text']} style={isSentSection ? {} : { display: 'none' }}>
            {t('member-application-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={isEditSection ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isSendSection ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isSentSection ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleModifyBtnClick}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('confirm')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isEditSection ? {} : { display: 'none' }}>
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

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
