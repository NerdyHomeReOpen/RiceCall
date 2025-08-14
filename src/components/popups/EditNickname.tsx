import React, { useEffect, useRef, useState } from 'react';

// Types
import type { Member, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface EditNicknamePopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ userId, serverId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [member, setMember] = useState<Member>(Default.member());
  const [user, setUser] = useState<User>(Default.user());

  // Variables
  const { nickname: memberNickname } = member;
  const { name: userName } = user;

  // Handlers
  const handleEditMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipcService.socket.send('editMember', { userId, serverId, update });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!userId || !serverId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: userId }).then((user) => {
        if (user) setUser(user);
      });
      getService.member({ userId: userId, serverId: serverId }).then((member) => {
        if (member) setMember(member);
      });
    };
    refresh();
  }, [userId, serverId]);

  return (
    <form className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={popup['input-box']}>
              <div className={popup['label']} style={{ minWidth: '2rem' }}>
                {t('nickname')}:
              </div>
              <div className={popup['label']}>{userName}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-enter-the-member-nickname')}</div>
              <input name="nickname" type="text" value={memberNickname || ''} maxLength={32} onChange={(e) => setMember((prev) => ({ ...prev, nickname: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditMember(userId, serverId, { nickname: memberNickname });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popup['button']} onClick={() => handleEditMember(userId, serverId, { nickname: memberNickname })}>
          {t('apply')}
        </div>
      </div>
    </form>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
