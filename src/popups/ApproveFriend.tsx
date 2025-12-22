import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface ApproveFriendPopupProps {
  targetId: Types.User['userId'];
  friendGroups: Types.FriendGroup[];
}

const ApproveFriendPopup: React.FC<ApproveFriendPopupProps> = React.memo(({ targetId, friendGroups: friendGroupsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendGroups, setFriendGroups] = useState<Types.FriendGroup[]>(friendGroupsData);
  const [friendNotes, setFriendNotes] = useState<string>('');
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');

  // Handlers
  const handleApproveFriendApplication = (senderId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId'] | null, friendNote: Types.Friend['note']) => {
    ipc.socket.send('approveFriendApplication', { senderId, friendGroupId, note: friendNote });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupAdd', (...args: { data: Types.FriendGroup }[]) => {
      const add = new Set(args.map((i) => `${i.data.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !add.has(`${fg.friendGroupId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args: { friendGroupId: string; update: Partial<Types.FriendGroup> }[]) => {
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
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('select-friend-group')}</div>
            <div className={popupStyles['row']}>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popupStyles['select']} onChange={(e) => setFriendGroupId(e.target.value)}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popupStyles['link-text']} onClick={() => Popup.handleOpenCreateFriendGroup()}>
                {t('create-friend-group')}
              </div>
            </div>
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('friend-note-name')}</div>
            <input className={popupStyles['input']} type="text" onChange={(e) => setFriendNotes(e.target.value)} style={{ maxWidth: '60%' }} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={() => handleApproveFriendApplication(targetId, friendGroupId || null, friendNotes)}>
          {t('add')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApproveFriendPopup.displayName = 'ApproveFriendPopup';

export default ApproveFriendPopup;
