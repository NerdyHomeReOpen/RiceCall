import React, { useEffect, useRef, useState } from 'react';

// Types
import { Member, User, Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface EditNicknamePopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(
  (initialData: EditNicknamePopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Variables
    const { userId, serverId } = initialData;

    // States
    const [memberNickname, setMemberNickname] = useState(
      createDefault.member().nickname,
    );
    const [userName, setUserName] = useState(createDefault.user().name);

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({ member, userId, serverId });
    };

    const handleMemberUpdate = (data: Member | null) => {
      if (!data) data = createDefault.member();
      setMemberNickname(data.nickname);
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserName(data.name);
    };

    // Effects
    useEffect(() => {
      if (!userId || !serverId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.member({
            userId: userId,
            serverId: serverId,
          }),
          refreshService.user({
            userId: userId,
          }),
        ]).then(([member, user]) => {
          handleMemberUpdate(member);
          handleUserUpdate(user);
        });
      };
      refresh();
    }, [userId, serverId]);

    return (
      <form className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={popup['inputBox']}>
                <label>{lang.tr.nickname}</label>
                <label className={popup['value']}>{userName}</label>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseEnterTheMemberNickname}
                </div>
                <input
                  className={popup['input']}
                  type="text"
                  value={memberNickname || ''}
                  onChange={(e) => {
                    setMemberNickname(e.target.value);
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
              handleUpdateMember(
                { nickname: memberNickname },
                userId,
                serverId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button
            type="button"
            className={popup['button']}
            onClick={() => handleClose()}
          >
            {lang.tr.cancel}
          </button>
          <button
            type="button"
            className={`${popup['button']}`}
            onClick={() => {
              handleUpdateMember(
                { nickname: memberNickname },
                userId,
                serverId,
              );
            }}
          >
            {lang.tr.set}
          </button>
        </div>
      </form>
    );
  },
);

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
