import React, { useState } from 'react';

// Types
import type { Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface MemberApplicationSettingPopupProps {
  serverId: Server['serverId'];
  server: Server;
}

const MemberApplicationSettingPopup: React.FC<MemberApplicationSettingPopupProps> = React.memo(({ serverId, server }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [serverReceiveApplication, setServerReceiveApplication] = useState<boolean>(server.receiveApply);
  const [serverApplyNote, setServerApplyNote] = useState<string>(server.applyNotice);

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServer', { serverId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['dialog-content']} ${popup['col']}`}>
          <div className={`${popup['input-box']} ${popup['row']}`}>
            <div className={popup['label']}>{t('is-receive-member-application-label')}</div>
            <input name="receive-apply" type="checkbox" checked={serverReceiveApplication} onChange={() => setServerReceiveApplication(!serverReceiveApplication)} />
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('apply-member-note')}</div>
            <textarea name="apply-note" value={serverApplyNote} maxLength={100} onChange={(e) => setServerApplyNote(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleEditServer(serverId, { receiveApply: !!serverReceiveApplication, applyNotice: serverApplyNote })}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

MemberApplicationSettingPopup.displayName = 'MemberApplicationSettingPopup';

export default MemberApplicationSettingPopup;
