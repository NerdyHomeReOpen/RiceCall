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
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface EditFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const EditFriendPopup: React.FC<EditFriendPopupProps> = React.memo(
  (initialData: EditFriendPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Variables
    const { userId, targetId } = initialData;

    // States
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>([]);
    const [friendGroup, setFriendGroup] = useState<Friend['friendGroupId']>(
      createDefault.friend().friendGroupId,
    );

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateFriend = (
      friend: Partial<Friend>,
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.updateFriend({ friend, userId, targetId });
    };

    const handleUserFriendGroupsUpdate = (data: FriendGroup[] | null) => {
      if (!data) data = [];
      setUserFriendGroups(data);
    };

    const handleFriendUpdate = (data: Friend | null) => {
      if (!data) data = createDefault.friend();
      setFriendGroup(data.friendGroupId);
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_FRIEND_GROUPS_UPDATE]:
          handleUserFriendGroupsUpdate,
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
          refreshService.userFriendGroups({
            userId: userId,
          }),
          refreshService.friend({
            userId: userId,
            targetId: targetId,
          }),
        ]).then(([userFriendGroups, friend]) => {
          handleUserFriendGroupsUpdate(userFriendGroups);
          handleFriendUpdate(friend);
        });
      };
      refresh();
    }, [userId, targetId]);

    return (
      <div className={popup['popupContainer']}>
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
                    value={friendGroup || ''}
                    onChange={(e) => {
                      setFriendGroup(e.target.value);
                    }}
                  >
                    <option value={''}>{lang.tr.none}</option>
                    {userFriendGroups.map((group) => (
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

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']}`}
            onClick={() => {
              handleUpdateFriend(
                { friendGroupId: friendGroup },
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
