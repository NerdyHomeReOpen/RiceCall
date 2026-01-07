import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Default from '@/utils/default';

import popupStyles from '@/styles/popup.module.css';

const CreateFriendGroupPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroupName, setFriendGroupName] = useState<Types.FriendGroup['name']>(Default.friendGroup().name);

  // Variables
  const canSubmit = friendGroupName.trim();

  // Handlers
  const handleFriendGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendGroupName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    ipc.socket.send('createFriendGroup', { preset: { name: friendGroupName } });
    ipc.window.close();
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
            <input name="friend-group-name" type="text" maxLength={32} onChange={handleFriendGroupNameChange} />
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

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
