import React, { useEffect, useRef, useState } from 'react';

// Types
import { FriendGroup, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface EditFriendGroupPopupProps {
  userId: User['userId'];
  friendGroupId: FriendGroup['friendGroupId'];
}

const EditFriendGroupPopup: React.FC<EditFriendGroupPopupProps> = React.memo(
  (initialData: EditFriendGroupPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Variables
    const { userId, friendGroupId } = initialData;

    // States
    const [groupName, setGroupName] = useState<string>(
      createDefault.friendGroup().name,
    );
    const [groupOrder, setGroupOrder] = useState<number>(
      createDefault.friendGroup().order,
    );

    // Handlers
    const handleUpdateFriendGroup = (
      group: Partial<FriendGroup>,
      friendGroupId: FriendGroup['friendGroupId'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.updateFriendGroup({ group, friendGroupId, userId });
    };

    const handleFriendGroupUpdate = (data: FriendGroup | null) => {
      if (!data) data = createDefault.friendGroup();
      setGroupName(data.name);
      setGroupOrder(data.order);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // FIXME: Add refresh
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_FRIEND_GROUPS_UPDATE]: handleFriendGroupUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!friendGroupId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.friendGroup({
            friendGroupId: friendGroupId,
          }),
        ]).then(([friendGroup]) => {
          handleFriendGroupUpdate(friendGroup);
        });
      };
      refresh();
    }, [friendGroupId]);

    return (
      <form className={popup['popupContainer']}>
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
            disabled={!groupName.trim()}
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
      </form>
    );
  },
);

EditFriendGroupPopup.displayName = 'EditFriendGroupPopup';

export default EditFriendGroupPopup;
