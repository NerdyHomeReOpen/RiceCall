import React, { useEffect, useRef, useState } from 'react';

// Types
import { Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

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

const MemberApplySettingPopup: React.FC<MemberApplySettingPopupProps> =
  React.memo(({ serverId }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [server, setServer] = useState<Server>(Default.server());

    // Variables
    const { receiveApply: serverReceiveApply, applyNotice: serverApplyNotice } =
      server;

    // Handlers
    const handleEditServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
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
                <div className={popup['label']}>{lang.tr.isReceiveApply}</div>
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
                <div className={popup['label']}>{lang.tr.setApplyNotice}</div>
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
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </form>
    );
  });

MemberApplySettingPopup.displayName = 'MemberApplySettingPopup';

export default MemberApplySettingPopup;
