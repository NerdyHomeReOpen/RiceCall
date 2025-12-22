import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface ApplyFriendPopupProps {
  userId: Types.User['userId'];
  targetId: Types.User['userId'];
  target: Types.User;
  friendGroups: Types.FriendGroup[];
  friendApplication: Types.FriendApplication | null;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ userId, targetId, friendGroups: friendGroupsData, target, friendApplication }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(friendApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [friendGroups, setFriendGroups] = useState<Types.FriendGroup[]>(friendGroupsData);
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');
  const [applicationDesc, setApplicationDesc] = useState<Types.FriendApplication['description']>(friendApplication?.description || '');

  // Variables
  const { name: targetName, displayId: targetDisplayId, avatarUrl: targetAvatarUrl } = target;

  // Handlers
  const handleSendFriendApplication = (receiverId: Types.User['userId'], preset: Partial<Types.FriendApplication>, friendGroupId: Types.FriendGroup['friendGroupId'] | null) => {
    ipc.socket.send('sendFriendApplication', { receiverId, preset, friendGroupId });
    ipc.window.close();
  };

  const handleEditFriendApplication = (receiverId: Types.User['userId'], update: Partial<Types.FriendApplication>) => {
    ipc.socket.send('editFriendApplication', { receiverId, update });
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
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['label']}>{t('apply-friend-label')}</div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']} onClick={() => Popup.handleOpenUserInfo(userId, targetId)}>
                {targetName}
              </div>
              <div className={popupStyles['sub-text']}>{targetDisplayId}</div>
            </div>
          </div>
          <div className={popupStyles['split']} />
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 0 ? {} : { display: 'none' }}>
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
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
          <div className={popupStyles['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('friend-application-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={() => handleSendFriendApplication(targetId, { description: applicationDesc }, friendGroupId || null)}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={() => setSection(2)}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('confirm')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={() => handleEditFriendApplication(targetId, { description: applicationDesc })}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
