import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

interface ApplyMemberPopupProps {
  id: string;
  server: Types.Server;
  memberApplication: Types.MemberApplication | null;
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ id, server, memberApplication }) => {
  const { t } = useTranslation();

  const [section, setSection] = useState<number>(memberApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
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

  const handleSubmitBtnClick = () => {
    Actions.sendMemberApplication(server.serverId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleSubmitEditBtnClick = () => {
    Actions.editMemberApplication(server.serverId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-content col">
          <div className="row">
            <div className="avatar-wrapper">
              <div className="avatar-picture" style={{ backgroundImage: `url(${server.avatarUrl})` }} />
            </div>
            <div className="info-wrapper">
              <div className="link-text">{server.name}</div>
              <div className="sub-text">{`ID: ${server.specialId || server.displayId}`}</div>
            </div>
          </div>
          <div className="input-box col">
            <div className="label">{t('apply-member-note')}</div>
            <div className="hint-text">{server.applyNotice || t('none')}</div>
          </div>
          <div className="split" />
          <div className="input-box col" style={isSendSection ? {} : { display: 'none' }}>
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
          <div className="hint-text" style={isSentSection ? {} : { display: 'none' }}>
            {t('member-application-sent')}
          </div>
          <div className="input-box col" style={isEditSection ? {} : { display: 'none' }}>
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer" style={isSendSection ? {} : { display: 'none' }}>
        <div className="button" onClick={handleSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className="popup-footer" style={isSentSection ? {} : { display: 'none' }}>
        <div className="button" onClick={handleModifyBtnClick}>
          {t('modify')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('confirm')}
        </div>
      </div>
      <div className="popup-footer" style={isEditSection ? {} : { display: 'none' }}>
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

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
