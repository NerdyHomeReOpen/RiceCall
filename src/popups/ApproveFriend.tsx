import React, { useEffect, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { FriendGroup, User, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/ipc';

// Utils
import { handleOpenCreateFriendGroup } from '@/utils/popup';

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
  const [friendGroupId, setFriendGroupId] = useState<FriendGroup['friendGroupId']>('');

  // Handlers
  const handleApproveFriendApplication = (senderId: User['userId'], friendGroupId: FriendGroup['friendGroupId'] | null, friendNote: Friend['note']) => {
    ipc.socket.send('approveFriendApplication', { senderId, friendGroupId, note: friendNote });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupAdd', (...args: { data: FriendGroup }[]) => {
      const add = new Set(args.map((i) => `${i.data.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !add.has(`${fg.friendGroupId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
      const update = new Map(args.map((i) => [`${i.friendGroupId}`, i.update] as const));
      setFriendGroups((prev) => prev.map((fg) => (update.has(`${fg.friendGroupId}`) ? { ...fg, ...update.get(`${fg.friendGroupId}`) } : fg)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupRemove', (...args: { friendGroupId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !remove.has(`${fg.friendGroupId}`)));
    });
    return () => unsub();
  }, []);

  return (
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={`${popup['dialog-content']} ${popup['col']}`}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('select-friend-group')}</div>
            <div className={popup['row']}>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popup['select']} onChange={(e) => setFriendGroupId(e.target.value)}>
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
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('friend-note-name')}</div>
            <input className={popup['input']} type="text" onChange={(e) => setFriendNotes(e.target.value)} style={{ maxWidth: '60%' }} />
          </div>
        </div>
      </div>
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleApproveFriendApplication(targetId, friendGroupId || null, friendNotes)}>
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
