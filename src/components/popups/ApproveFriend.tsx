import React, { useEffect, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { FriendGroup, User, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

interface ApproveFriendPopupProps {
  targetId: User['userId'];
  friendGroups: FriendGroup[];
}

const ApproveFriendPopup: React.FC<ApproveFriendPopupProps> = React.memo(({ targetId, friendGroups: friendGroupsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>(friendGroupsData);
  const [friendNotes, setFriendNotes] = useState<string>('');
  const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<FriendGroup['friendGroupId'] | null>(null);

  // Destructuring
  // const { name: targetName, displayId: targetDisplayId, avatarUrl: targetAvatarUrl } = target;

  // Handlers
  const handleApproveFriendApplication = (senderId: User['userId'], friendGroupId: FriendGroup['friendGroupId'] | null, friendNote: Friend['note']) => {
    ipc.socket.send('approveFriendApplication', { senderId, friendGroupId, note: friendNote });
  };

  const handleOpenCreateFriendGroup = () => {
    ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
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
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('select-friend-group')}</div>
            <div className={popup['row']}>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popup['select']} value={selectedFriendGroupId || ''} onChange={(e) => setSelectedFriendGroupId(e.target.value || null)}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popup['link-text']} onClick={() => handleOpenCreateFriendGroup()}>
                {t('create-friend-group')}
              </div>
            </div>
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={{ maxWidth: '60%' }}>
            <div className={popup['label']}>{t('friend-note-name')}</div>
            <input className={popup['input']} type="text" value={friendNotes} onChange={(e) => setFriendNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleApproveFriendApplication(targetId, selectedFriendGroupId, friendNotes);
            handleClose();
          }}
        >
          {t('add')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApproveFriendPopup.displayName = 'ApproveFriendPopup';

export default ApproveFriendPopup;
