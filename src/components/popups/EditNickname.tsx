import React, { useState } from 'react';

// Types
import type { Member, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface EditNicknamePopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  member: Member;
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ userId, serverId, member: memberData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [member, setMember] = useState<Member>(memberData);

  // Destructuring
  const { nickname: memberNickname, name: memberName } = member;

  // Handlers
  const handleEditMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipc.socket.send('editMember', { userId, serverId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['col']}>
            <div className={popup['input-box']}>
              <div className={popup['label']} style={{ minWidth: '2rem' }}>
                {t('nickname')}:
              </div>
              <div className={popup['label']}>{memberName}</div>
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
    </div>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
