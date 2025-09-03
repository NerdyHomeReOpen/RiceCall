import React, { useEffect, useState } from 'react';

// Types
import type { User, Friend, FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface EditFriendFriendGroupPopupProps {
  friend: Friend;
  friendGroups: FriendGroup[];
}

const EditFriendFriendGroupPopup: React.FC<EditFriendFriendGroupPopupProps> = React.memo(({ friend: friendData, friendGroups: friendGroupsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friend, setFriend] = useState<Friend>(friendData);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>(friendGroupsData);

  // Variables
  const { targetId, friendGroupId } = friend;

  // Handlers
  const handleEditFriend = (targetId: User['userId'], update: Partial<Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleFriendGroupAdd = (...args: { data: FriendGroup }[]) => {
    setFriendGroups((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleFriendGroupUpdate = (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
    const update = new Map(args.map((i) => [`${i.friendGroupId}`, i.update] as const));
    setFriendGroups((prev) => prev.map((fg) => (update.has(`${fg.friendGroupId}`) ? { ...fg, ...update.get(`${fg.friendGroupId}`) } : fg)));
  };

  const handleFriendGroupRemove = (...args: { friendGroupId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.friendGroupId}`));
    setFriendGroups((prev) => prev.filter((fg) => !remove.has(`${fg.friendGroupId}`)));
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipc.socket.on('friendGroupAdd', handleFriendGroupAdd),
      ipc.socket.on('friendGroupUpdate', handleFriendGroupUpdate),
      ipc.socket.on('friendGroupRemove', handleFriendGroupRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <div className={popup['label']}>{t('select-friend-group')}</div>
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
          className={popup['button']}
          onClick={() => {
            handleEditFriend(targetId, { friendGroupId: friendGroupId || null });
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

EditFriendFriendGroupPopup.displayName = 'EditFriendFriendGroupPopup';

export default EditFriendFriendGroupPopup;
