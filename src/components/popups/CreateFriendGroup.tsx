import React, { useState } from 'react';

// Types
import type { FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

const CreateFriendGroupPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroup, setFriendGroup] = useState<FriendGroup>(Default.friendGroup());

  // Variables
  const { name: groupName, order: groupOrder } = friendGroup;
  const canSubmit = groupName.trim();

  // Handlers
  const handleCreateFriendGroup = (preset: Partial<FriendGroup>) => {
    ipcService.socket.send('createFriendGroup', { preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-input-friend-group-name')}</div>
            <input name="friend-group-name" type="text" value={groupName} maxLength={32} onChange={(e) => setFriendGroup((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleCreateFriendGroup({ name: groupName, order: groupOrder });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
