import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface MemberApplicationSettingPopupProps {
  id: string;
  server: Types.Server;
}

const MemberApplicationSettingPopup: React.FC<MemberApplicationSettingPopupProps> = React.memo(({ id, server }) => {
  const { t } = useTranslation();

  const [serverReceiveApplication, setServerReceiveApplication] = useState<boolean>(server.receiveApply);
  const [serverApplyNote, setServerApplyNote] = useState<string>(server.applyNotice);

  const handleReceiveApplicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerReceiveApplication(e.target.checked);
  };

  const handleApplyNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setServerApplyNote(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    Actions.editServer(server.serverId, { receiveApply: !!serverReceiveApplication, applyNotice: serverApplyNote });
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content col">
          <div className="input-box row">
            <div className="label">{t('is-receive-member-application-label')}</div>
            <input name="receive-apply" type="checkbox" checked={serverReceiveApplication} onChange={handleReceiveApplicationChange} />
          </div>
          <div className="input-box col">
            <div className="label">{t('apply-member-note')}</div>
            <textarea name="apply-note" value={serverApplyNote} maxLength={100} onChange={handleApplyNoteChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

MemberApplicationSettingPopup.displayName = 'MemberApplicationSettingPopup';

export default MemberApplicationSettingPopup;
