import React, { useState } from 'react';

// Types
import type { Member, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

interface EditNicknamePopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  member: Member;
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ userId, serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [memberNickname, setMemberNickname] = useState<string>(member.nickname || '');

  // Variables
  const { name: memberName } = member;

  // Handlers
  const handleEditMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipc.socket.send('editMember', { userId, serverId, update });
    ipc.window.close();
  };

  const applyEditMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipc.socket.send('editMember', { userId, serverId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={`${popup['dialog-content']} ${popup['col']}`}>
          <div className={popup['input-box']}>
            <div className={popup['label']} style={{ minWidth: '2rem' }}>
              {t('nickname')}:
            </div>
            <div className={popup['label']}>{memberName}</div>
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-enter-the-member-nickname')}</div>
            <input name="nickname" type="text" value={memberNickname} maxLength={32} onChange={(e) => setMemberNickname(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleEditMember(userId, serverId, { nickname: memberNickname || null })}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popup['button']} onClick={() => applyEditMember(userId, serverId, { nickname: memberNickname || null })}>
          {t('apply')}
        </div>
      </div>
    </div>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
