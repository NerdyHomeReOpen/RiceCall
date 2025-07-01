import React, { useEffect, useRef, useState } from 'react';

// Types
import { Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

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
  const { receiveApply: serverReceiveApply, applyNotice: serverApplyNotice } = server;

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
    <form className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={popup['inputGroup']}>
            <div className={`${popup['inputBox']} ${popup['row']}`}>
              <div className={popup['label']}>{t('is-receive-apply')}</div>
              <input
                name="receiveApply"
                type="checkbox"
                checked={serverReceiveApply}
                onChange={() => {
                  setServer((prev) => ({
                    ...prev,
                    receiveApply: !serverReceiveApply,
                  }));
                }}
              />
            </div>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <div className={popup['label']}>{t('set-apply-notice')}</div>
              <textarea
                name="applyNotice"
                value={serverApplyNotice}
                maxLength={100}
                onChange={(e) => {
                  setServer((prev) => ({
                    ...prev,
                    applyNotice: e.target.value,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <button
          className={popup['button']}
          onClick={() => {
            handleEditServer(
              {
                receiveApply: !!serverReceiveApply,
                applyNotice: serverApplyNotice,
              },
              serverId,
            );
            handleClose();
          }}
        >
          {t('confirm')}
        </button>
        <button className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
});

MemberApplySettingPopup.displayName = 'MemberApplySettingPopup';

export default MemberApplySettingPopup;
