import React, { useEffect, useRef, useState } from 'react';

// Types
import type { User, Friend, FriendGroup } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useTranslation } from 'react-i18next';

// CSS
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

const EditFriendPopup: React.FC<EditFriendPopupProps> = React.memo(({ userId, targetId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

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

  const handleFriendGroupAdd = (...args: { data: FriendGroup }[]) => {
    args.forEach((arg) => {
      setFriendGroups((prev) => [...prev, arg.data]);
    });
  };

  const handleFriendGroupUpdate = (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
    args.forEach((arg) => {
      setFriendGroups((prev) => prev.map((item) => (item.friendGroupId === arg.friendGroupId ? { ...item, ...arg.update } : item)));
    });
  };

  const handleFriendGroupRemove = (...args: { friendGroupId: string }[]) => {
    args.forEach((arg) => {
      setFriendGroups((prev) => prev.filter((item) => item.friendGroupId !== arg.friendGroupId));
    });
  };

  const handleEditFriend = (targetId: User['userId'], update: Partial<Friend>) => {
    ipcService.socket.send('editFriend', { targetId, update });
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipcService.socket.on('friendGroupAdd', handleFriendGroupAdd),
      ipcService.socket.on('friendGroupUpdate', handleFriendGroupUpdate),
      ipcService.socket.on('friendGroupRemove', handleFriendGroupRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [socket.isConnected]);

  useEffect(() => {
    if (!userId || !targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.friend({ userId: userId, targetId: targetId }).then((friend) => {
        if (friend) setFriend(friend);
      });
      getService.friendGroups({ userId: userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
    };
    refresh();
  }, [userId, targetId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <div className={popup['label']}>{t('friend-select-group')}</div>
              <div className={popup['select-box']}>
                <select name="friend-group" value={friendGroupId || ''} onChange={(e) => setFriend((prev) => ({ ...prev, friendGroupId: e.target.value }))}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
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
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']}`}
          onClick={() => {
            handleEditFriend(targetId, { friendGroupId: friendGroupId || null });
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

EditFriendPopup.displayName = 'EditFriendPopup';

export default EditFriendPopup;
