import React, { useMemo, useState } from 'react';

// Types
import type { FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

const CreateFriendGroupPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroupName, setFriendGroupName] = useState<FriendGroup['name']>(Default.friendGroup().name);

  // Memos
  const canSubmit = useMemo(() => friendGroupName.trim(), [friendGroupName]);

  // Handlers
  const handleCreateFriendGroup = (preset: Partial<FriendGroup>) => {
    ipc.socket.send('createFriendGroup', { preset });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('please-input-friend-group-name')}</div>
            <input name="friend-group-name" type="text" maxLength={32} onChange={(e) => setFriendGroupName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleCreateFriendGroup({ name: friendGroupName });
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
