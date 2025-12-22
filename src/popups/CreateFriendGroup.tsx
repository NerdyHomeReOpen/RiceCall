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
  const handleCreateFriendGroup = (preset: Partial<Types.FriendGroup>) => {
    ipc.socket.send('createFriendGroup', { preset });
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
            <input name="friend-group-name" type="text" maxLength={32} onChange={(e) => setFriendGroupName(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleCreateFriendGroup({ name: friendGroupName }) : null)}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
