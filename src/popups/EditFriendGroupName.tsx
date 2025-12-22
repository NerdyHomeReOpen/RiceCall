import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import popupStyles from '@/styles/popup.module.css';

interface EditFriendGroupNamePopupProps {
  friendGroupId: Types.FriendGroup['friendGroupId'];
  friendGroup: Types.FriendGroup;
}

const EditFriendGroupNamePopup: React.FC<EditFriendGroupNamePopupProps> = React.memo(({ friendGroupId, friendGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroupName, setFriendGroupName] = useState<string>(friendGroup.name);

  // Variables
  const canSubmit = friendGroupName.trim();

  // Handlers
  const handleEditFriendGroup = (friendGroupId: Types.FriendGroup['friendGroupId'], update: Partial<Types.FriendGroup>) => {
    ipc.socket.send('editFriendGroup', { friendGroupId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('please-input-friend-group-name')}</div>
            <input name="friend-group-name" type="text" value={friendGroupName} maxLength={32} onChange={(e) => setFriendGroupName(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleEditFriendGroup(friendGroupId, { name: friendGroupName }) : null)}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendGroupNamePopup.displayName = 'EditFriendGroupNamePopup';

export default EditFriendGroupNamePopup;
