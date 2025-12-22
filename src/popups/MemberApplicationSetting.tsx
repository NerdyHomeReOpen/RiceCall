import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import popupStyles from '@/styles/popup.module.css';

interface MemberApplicationSettingPopupProps {
  serverId: Types.Server['serverId'];
  server: Types.Server;
}

const MemberApplicationSettingPopup: React.FC<MemberApplicationSettingPopupProps> = React.memo(({ serverId, server }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [serverReceiveApplication, setServerReceiveApplication] = useState<boolean>(server.receiveApply);
  const [serverApplyNote, setServerApplyNote] = useState<string>(server.applyNotice);

  // Handlers
  const handleEditServer = (serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
    ipc.socket.send('editServer', { serverId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
            <div className={popupStyles['label']}>{t('is-receive-member-application-label')}</div>
            <input name="receive-apply" type="checkbox" checked={serverReceiveApplication} onChange={() => setServerReceiveApplication(!serverReceiveApplication)} />
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('apply-member-note')}</div>
            <textarea name="apply-note" value={serverApplyNote} maxLength={100} onChange={(e) => setServerApplyNote(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={() => handleEditServer(serverId, { receiveApply: !!serverReceiveApplication, applyNotice: serverApplyNote })}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

MemberApplicationSettingPopup.displayName = 'MemberApplicationSettingPopup';

export default MemberApplicationSettingPopup;
