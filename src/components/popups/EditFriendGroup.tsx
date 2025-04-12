import React, { useState } from 'react';

// Types
import { FriendGroup, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface EditFriendGroupPopupProps {
  userId: User['userId'];
  friendGroupId: FriendGroup['friendGroupId'];
  friendGroupName: FriendGroup['name'];
  friendGroupOrder: FriendGroup['order'];
}

const EditFriendGroupPopup: React.FC<EditFriendGroupPopupProps> = React.memo(
  (initialData: EditFriendGroupPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Variables
    const { userId, friendGroupId, friendGroupName, friendGroupOrder } =
      initialData;

    // States
    const [groupName, setGroupName] = useState<string>(friendGroupName);
    const [groupOrder, setGroupOrder] = useState<number>(friendGroupOrder);

    // Handlers
    const handleUpdateFriendGroup = (
      group: Partial<FriendGroup>,
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.updateFriendGroup({ group, friendGroupId, userId });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // FIXME: Add refresh

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['row']}`}>
                <div
                  className={`${popup['inputBox']} ${popup['col']}`}
                  style={{
                    flex: '3',
                  }}
                >
                  <div className={popup['label']}>
                    {lang.tr.pleaseInputFriendGroupName}
                  </div>
                  <input
                    className={popup['input']}
                    type="text"
                    placeholder={groupName}
                    value={groupName}
                    maxLength={20}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['col']}`}
                  style={{
                    flex: '1',
                  }}
                >
                  <div className={popup['label']}>
                    {lang.tr.friendGroupOrder}
                  </div>
                  <input
                    className={popup['input']}
                    type="number"
                    placeholder={groupOrder.toString()}
                    value={groupOrder}
                    max={999}
                    min={-999}
                    onChange={(e) =>
                      setGroupOrder(parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !groupName.trim() ? popup['disabled'] : ''
            }`}
            disabled={
              !groupName.trim() ||
              (groupName === friendGroupName && groupOrder === friendGroupOrder)
            }
            onClick={() => {
              handleUpdateFriendGroup(
                { name: groupName, order: groupOrder },
                friendGroupId,
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
  },
);

EditFriendGroupPopup.displayName = 'EditFriendGroupPopup';

export default EditFriendGroupPopup;
