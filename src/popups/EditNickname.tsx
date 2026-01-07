import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface EditNicknamePopupProps {
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // States
  const [memberNickname, setMemberNickname] = useState<string>(member.nickname || '');

  // Variables
  const { userId } = user;
  const { name: memberName } = member;

  // Handlers
  const handleConfirmBtnClick = () => {
    Popup.editMember(userId, serverId, { nickname: memberNickname || null });
    ipc.window.close();
  };

  const handleApplyBtnClick = () => {
    Popup.editMember(userId, serverId, { nickname: memberNickname || null });
  };

  const handleCloseBtnClick = () => {
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
        <div className={popupStyles['button']} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
        <div className={popupStyles['button']} onClick={handleApplyBtnClick}>
          {t('apply')}
        </div>
      </div>
    </div>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
