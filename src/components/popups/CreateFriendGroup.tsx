import React, { useState } from 'react';

// Types
import { FriendGroup, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface CreateFriendGroupPopupProps {
  userId: User['userId'];
}

const CreateFriendGroupPopup: React.FC<CreateFriendGroupPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // States
  const [friendGroup, setFriendGroup] = useState<FriendGroup>(Default.friendGroup());

  // Variables
  const { name: groupName, order: groupOrder } = friendGroup;
  const canCreate = groupName.trim();

  // Handlers
  const handleCreateFriendGroup = (group: Partial<FriendGroup>, userId: User['userId']) => {
    if (!socket) return;
    socket.send.createFriendGroup({ group, userId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={popup['inputGroup']}>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-input-friend-group-name')}</div>
              <input
                name="name"
                type="text"
                value={groupName}
                maxLength={32}
                onChange={(e) =>
                  setFriendGroup((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div
          className={`${popup['button']} ${!canCreate ? popup['disabled'] : ''}`}
          onClick={() => {
            handleCreateFriendGroup({ name: groupName, order: groupOrder }, userId);
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
