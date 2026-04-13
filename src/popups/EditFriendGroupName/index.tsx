import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface EditFriendGroupNamePopupProps {
  id: string;
  friendGroup: Types.FriendGroup;
}

const EditFriendGroupNamePopup: React.FC<EditFriendGroupNamePopupProps> = React.memo(({ id, friendGroup }) => {
  const { t } = useTranslation();

  const [friendGroupName, setFriendGroupName] = useState<string>(friendGroup.name);

  const canSubmit = friendGroupName.trim();

  const handleFriendGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendGroupName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Actions.editFriendGroup(friendGroup.friendGroupId, { name: friendGroupName });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="input-box col">
            <div className="label">{t('please-input-friend-group-name')}</div>
            <input name="friend-group-name" type="text" value={friendGroupName} maxLength={32} onChange={handleFriendGroupNameChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendGroupNamePopup.displayName = 'EditFriendGroupNamePopup';

export default EditFriendGroupNamePopup;
