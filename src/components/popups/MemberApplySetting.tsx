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

    // Variables
    const { serverId } = initialData;

    // States
    const [isReceiveApply, setIsReceiveApply] = useState<boolean>(
      createDefault.server().receiveApply,
    );
    const [applyNotice, setApplyNotice] = useState<string>(
      createDefault.server().applyNotice,
    );

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ server, serverId });
    };

    const handleServerUpdate = (data: Server | null) => {
      if (!data) data = createDefault.server();
      setIsReceiveApply(data.receiveApply);
      setApplyNotice(data.applyNotice);
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
          handleServerUpdate(server);
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
                <label className={popup['label']}>
                  {lang.tr.isReceiveApply}
                </label>
                <input
                  type="checkbox"
                  checked={isReceiveApply}
                  onChange={() => {
                    setIsReceiveApply(!isReceiveApply);
                  }}
                />
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{lang.tr.setApplyNotice}</div>
                <input
                  type="text"
                  value={applyNotice}
                  onChange={(e) => {
                    setApplyNotice(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']}`}
            onClick={() => {
              handleUpdateServer(
                { receiveApply: isReceiveApply, applyNotice: applyNotice },
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
