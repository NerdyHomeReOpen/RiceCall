import React, { useEffect, useRef, useState } from 'react';

// Types
import { Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface MemberApplySettingPopupProps {
  serverId: Server['serverId'];
}

const MemberApplySettingPopup: React.FC<MemberApplySettingPopupProps> = React.memo(({ serverId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [server, setServer] = useState<Server>(Default.server());

  // Variables
  const { receiveApply: serverReceiveApplication, applyNotice: serverApplyNote } = server;

  // Handlers
  const handleEditServer = (server: Partial<Server>, serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.editServer({ server, serverId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!serverId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.server({
          serverId: serverId,
        }),
      ]).then(([server]) => {
        if (server) {
          setServer(server);
        }
      });
    };
    refresh();
  }, [serverId]);

  return (
    <form className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <div className={popup['label']}>{t('is-receive-apply')}</div>
              <input
                name="receive-apply"
                type="checkbox"
                checked={serverReceiveApplication}
                onChange={() => setServer((prev) => ({ ...prev, receiveApply: !serverReceiveApplication }))}
              />
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('member-apply-note')}</div>
              <textarea
                name="apply-note"
                value={serverApplyNote}
                maxLength={100}
                onChange={(e) => setServer((prev) => ({ ...prev, applyNote: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditServer({ receiveApply: !!serverReceiveApplication, applyNotice: serverApplyNote }, serverId);
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </form>
  );
});

MemberApplySettingPopup.displayName = 'MemberApplySettingPopup';

export default MemberApplySettingPopup;
