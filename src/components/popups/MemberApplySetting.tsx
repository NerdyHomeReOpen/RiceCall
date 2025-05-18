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
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface MemberApplySettingPopupProps {
  serverId: Server['serverId'];
}

const MemberApplySettingPopup: React.FC<MemberApplySettingPopupProps> =
  React.memo((initialData: MemberApplySettingPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [server, setServer] = useState<Server>(createDefault.server());

    // Variables
    const { serverId } = initialData;
    const { receiveApply: serverReceiveApply, applyNotice: serverApplyNotice } =
      server;

    // Handlers
    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ server, serverId });
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
          refreshService.server({
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
        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            onClick={() => {
              handleUpdateServer(
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
