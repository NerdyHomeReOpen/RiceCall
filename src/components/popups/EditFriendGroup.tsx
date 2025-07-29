import React, { useEffect, useRef, useState } from 'react';

// Types
import { FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface EditFriendGroupPopupProps {
  friendGroupId: FriendGroup['friendGroupId'];
}

const EditFriendGroupPopup: React.FC<EditFriendGroupPopupProps> = React.memo(({ friendGroupId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [friendGroup, setFriendGroup] = useState<FriendGroup>(Default.friendGroup());

  // Variables
  const { name: groupName, order: groupOrder } = friendGroup;
  const canSubmit = groupName.trim();

  // Handlers
  const handleEditFriendGroup = (friendGroupId: FriendGroup['friendGroupId'], update: Partial<FriendGroup>) => {
    ipcService.socket.send('editFriendGroup', { friendGroupId, update });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!friendGroupId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.friendGroup({ friendGroupId: friendGroupId }).then((friendGroup) => {
        if (friendGroup) setFriendGroup(friendGroup);
      });
    };
    refresh();
  }, [friendGroupId]);

  return (
    <form className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-input-friend-group-name')}</div>
              <input name="friend-group-name" type="text" value={groupName} maxLength={32} onChange={(e) => setFriendGroup((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            if (!canSubmit) return;
            handleEditFriendGroup(friendGroupId, { name: groupName, order: groupOrder });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </form>
  );
});

EditFriendGroupPopup.displayName = 'EditFriendGroupPopup';

export default EditFriendGroupPopup;
