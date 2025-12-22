import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import popupStyles from '@/styles/popup.module.css';

interface EditNicknamePopupProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ userId, serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [memberNickname, setMemberNickname] = useState<string>(member.nickname || '');

  // Variables
  const { name: memberName } = member;

  // Handlers
  const handleEditMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Member>) => {
    ipc.socket.send('editMember', { userId, serverId, update });
    ipc.window.close();
  };

  const applyEditMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Member>) => {
    ipc.socket.send('editMember', { userId, serverId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={popupStyles['input-box']}>
            <div className={popupStyles['label']} style={{ minWidth: '2rem' }}>
              {t('nickname')}:
            </div>
            <div className={popupStyles['label']}>{memberName}</div>
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('please-enter-the-member-nickname')}</div>
            <input name="nickname" type="text" value={memberNickname} maxLength={32} onChange={(e) => setMemberNickname(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={() => handleEditMember(userId, serverId, { nickname: memberNickname || null })}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popupStyles['button']} onClick={() => applyEditMember(userId, serverId, { nickname: memberNickname || null })}>
          {t('apply')}
        </div>
      </div>
    </div>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
