import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface EditNicknamePopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ id, serverId, member }) => {
  const { t } = useTranslation();

  const [memberNickname, setMemberNickname] = useState<string>(member.nickname || '');

  const handleConfirmBtnClick = () => {
    Actions.editMember(member.userId, serverId, { nickname: memberNickname || null });
    ipc.popup.close(id);
  };

  const handleApplyBtnClick = () => {
    Actions.editMember(member.userId, serverId, { nickname: memberNickname || null });
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content col">
          <div className="input-box">
            <div className="label" style={{ minWidth: '2rem' }}>
              {t('nickname')}:
            </div>
            <div className="label">{member.name}</div>
          </div>
          <div className="input-box col">
            <div className="label">{t('please-enter-the-member-nickname')}</div>
            <input name="nickname" type="text" value={memberNickname} maxLength={32} onChange={(e) => setMemberNickname(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
        <div className="button" onClick={handleApplyBtnClick}>
          {t('apply')}
        </div>
      </div>
    </div>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
