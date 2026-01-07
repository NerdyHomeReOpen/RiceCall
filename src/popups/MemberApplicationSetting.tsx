import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface MemberApplicationSettingPopupProps {
  server: Types.Server;
}

const MemberApplicationSettingPopup: React.FC<MemberApplicationSettingPopupProps> = React.memo(({ server }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [serverReceiveApplication, setServerReceiveApplication] = useState<boolean>(server.receiveApply);
  const [serverApplyNote, setServerApplyNote] = useState<string>(server.applyNotice);

  // Variables
  const { serverId } = server;

  // Handlers
  const handleReceiveApplicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerReceiveApplication(e.target.checked);
  };

  const handleApplyNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setServerApplyNote(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    Popup.editServer(serverId, { receiveApply: !!serverReceiveApplication, applyNotice: serverApplyNote });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
            <div className={popupStyles['label']}>{t('is-receive-member-application-label')}</div>
            <input name="receive-apply" type="checkbox" checked={serverReceiveApplication} onChange={handleReceiveApplicationChange} />
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('apply-member-note')}</div>
            <textarea name="apply-note" value={serverApplyNote} maxLength={100} onChange={handleApplyNoteChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

MemberApplicationSettingPopup.displayName = 'MemberApplicationSettingPopup';

export default MemberApplicationSettingPopup;
