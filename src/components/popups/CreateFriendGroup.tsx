import React, { useState } from 'react';

// Types
import { FriendGroup, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface CreateFriendGroupPopupProps {
  userId: User['userId'];
}

const CreateFriendGroupPopup: React.FC<CreateFriendGroupPopupProps> =
  React.memo((initialData: CreateFriendGroupPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [friendGroup, setFriendGroup] = useState<FriendGroup>(
      createDefault.friendGroup(),
    );

    // Variables
    const { userId } = initialData;
    const { name: groupName, order: groupOrder } = friendGroup;

    // Handlers
    const handleCreateFriendGroup = (
      group: Partial<FriendGroup>,
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.createFriendGroup({ group, userId });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseInputFriendGroupName}
                </div>
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

        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            disabled={!groupName.trim()}
            onClick={() => {
              handleCreateFriendGroup(
                { name: groupName, order: groupOrder },
                userId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  });

CreateFriendGroupPopup.displayName = 'CreateFriendGroupPopup';

export default CreateFriendGroupPopup;
