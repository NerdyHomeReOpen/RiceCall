import React, { useMemo, useState } from 'react';

// Types
import type { FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface EditFriendGroupNamePopupProps {
  friendGroup: FriendGroup;
}

const EditFriendGroupNamePopup: React.FC<EditFriendGroupNamePopupProps> = React.memo(({ friendGroup: originFriendGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroup, setFriendGroup] = useState<FriendGroup>(originFriendGroup);

  // Destructuring
  const { friendGroupId, name: friendGroupName } = friendGroup;

  // Memos
  const canSubmit = useMemo(() => friendGroupName.trim(), [friendGroupName]);

  // Handlers
  const handleEditFriendGroup = (friendGroupId: FriendGroup['friendGroupId'], update: Partial<FriendGroup>) => {
    ipc.socket.send('editFriendGroup', { friendGroupId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-input-friend-group-name')}</div>
              <input name="friend-group-name" type="text" value={friendGroupName} maxLength={32} onChange={(e) => setFriendGroup((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleEditFriendGroup(friendGroupId, { name: friendGroupName });
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

EditFriendGroupNamePopup.displayName = 'EditFriendGroupNamePopup';

export default EditFriendGroupNamePopup;
