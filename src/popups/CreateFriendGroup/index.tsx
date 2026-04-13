import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import { getDefaultFriendGroup } from '@/utils/default';

interface CreateFriendGroupPopupProps {
  id: string;
}

const CreateFriendGroupPopup: React.FC<CreateFriendGroupPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();

  const [friendGroupName, setFriendGroupName] = useState<Types.FriendGroup['name']>(getDefaultFriendGroup({ friendGroupId: 'default' }).name);

  const canSubmit = friendGroupName.trim();

  const handleFriendGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendGroupName(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    ipc.socket.send('createFriendGroup', { preset: { name: friendGroupName } });
    ipc.popup.close(id);
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
            <input name="friend-group-name" type="text" maxLength={32} onChange={handleFriendGroupNameChange} />
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

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
