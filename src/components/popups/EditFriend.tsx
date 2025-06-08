import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, Friend, FriendGroup, SocketServerEvent } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface EditFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const EditFriendPopup: React.FC<EditFriendPopupProps> = React.memo(
  ({ userId, targetId }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
    const [friend, setFriend] = useState<Friend>(Default.friend());

    // Variables
    const { friendGroupId } = friend;

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleFriendGroupAdd = (data: FriendGroup) => {
      setFriendGroups((prev) => [...prev, data]);
    };

    const handleFriendGroupUpdate = (
      id: FriendGroup['friendGroupId'],
      data: Partial<FriendGroup>,
    ) => {
      setFriendGroups((prev) =>
        prev.map((item) =>
          item.friendGroupId === id ? { ...item, ...data } : item,
        ),
      );
    };

    const handleFriendGroupRemove = (id: FriendGroup['friendGroupId']) => {
      setFriendGroups((prev) =>
        prev.filter((item) => item.friendGroupId !== id),
      );
    };

    const handleEditFriend = (
      friend: Partial<Friend>,
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.editFriend({ friend, userId, targetId });
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.FRIEND_GROUP_ADD]: handleFriendGroupAdd,
        [SocketServerEvent.FRIEND_GROUP_UPDATE]: handleFriendGroupUpdate,
        [SocketServerEvent.FRIEND_GROUP_REMOVE]: handleFriendGroupRemove,
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
      if (!userId || !targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          getService.userFriendGroups({
            userId: userId,
          }),
          getService.friend({
            userId: userId,
            targetId: targetId,
          }),
        ]).then(([friendGroups, friend]) => {
          if (friendGroups) {
            setFriendGroups(friendGroups);
          }
          if (friend) {
            setFriend(friend);
          }
        });
      };
      refresh();
    }, [userId, targetId]);

    return (
      <div className={popup['popupContainer']}>
        {/* Body */}
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {lang.tr.friendSelectGroup}
                </div>
                <div className={popup['selectBox']}>
                  <select
                    className={popup['input']}
                    value={friendGroupId || ''}
                    onChange={(e) => {
                      setFriend((prev) => ({
                        ...prev,
                        friendGroupId: e.target.value,
                      }));
                    }}
                  >
                    <option value={''}>{lang.tr.none}</option>
                    {friendGroups.map((group) => (
                      <option
                        key={group.friendGroupId}
                        value={group.friendGroupId}
                      >
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']}`}
            onClick={() => {
              handleEditFriend(
                { friendGroupId: friendGroupId },
                userId,
                targetId,
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

EditFriendPopup.displayName = 'EditFriendPopup';

export default EditFriendPopup;
