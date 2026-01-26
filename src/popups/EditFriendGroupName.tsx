import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface EditFriendGroupNamePopupProps {
  friendGroup: Types.FriendGroup;
}

const EditFriendGroupNamePopup: React.FC<EditFriendGroupNamePopupProps> = React.memo(({ friendGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroupName, setFriendGroupName] = useState<string>(friendGroup.name);

  // Variables
  const canSubmit = friendGroupName.trim();

  // Handlers
  const handleFriendGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendGroupName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Popup.editFriendGroup(friendGroup.friendGroupId, { name: friendGroupName });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('please-input-friend-group-name')}</div>
            <input name="friend-group-name" type="text" value={friendGroupName} maxLength={32} onChange={handleFriendGroupNameChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendGroupNamePopup.displayName = 'EditFriendGroupNamePopup';

export default EditFriendGroupNamePopup;
