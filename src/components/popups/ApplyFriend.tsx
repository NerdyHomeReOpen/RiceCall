import React, { useEffect, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { FriendApplication, FriendGroup, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface ApplyFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  friendGroups: FriendGroup[];
  target: User;
  sentFriendApplication: FriendApplication | null;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ userId, targetId, friendGroups: friendGroupsData, target, sentFriendApplication: sentFriendApplicationData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(sentFriendApplicationData ? 1 : 0); // 0: send, 1: sent, 2: edit, 3: approve
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>(friendGroupsData);
  const [friendApplication, setFriendApplication] = useState<FriendApplication>(sentFriendApplicationData || Default.friendApplication());
  const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<FriendGroup['friendGroupId'] | null>(null);

  // Destructuring
  const { name: targetName, displayId: targetDisplayId, avatarUrl: targetAvatarUrl } = target;
  const { description: applicationDesc } = friendApplication;

  // Handlers
  const handleSendFriendApplication = (receiverId: User['userId'], preset: Partial<FriendApplication>, friendGroupId: FriendGroup['friendGroupId'] | null) => {
    ipc.socket.send('sendFriendApplication', { receiverId, preset, friendGroupId });
  };

  const handleEditFriendApplication = (receiverId: User['userId'], update: Partial<FriendApplication>) => {
    ipc.socket.send('editFriendApplication', { receiverId, update });
  };

  const handleOpenCreateFriendGroup = () => {
    ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
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
          <div className={popup['label']}>{t('apply-friend-label')}</div>
          <div className={popup['row']}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['link-text']} onClick={() => handleOpenUserInfo(userId, targetId)}>
                {targetName}
              </div>
              <div className={popup['sub-text']}>{targetDisplayId}</div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('select-friend-group')}</div>
            <div className={popup['row']}>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popup['select']} value={selectedFriendGroupId || ''} onChange={(e) => setSelectedFriendGroupId(e.target.value)}>
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
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setFriendApplication((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('friend-application-sent')}
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setFriendApplication((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 3 ? {} : { display: 'none' }}>
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
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleSendFriendApplication(targetId, { description: applicationDesc }, selectedFriendGroupId);
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popup['button']} onClick={() => setSection(2)}>
          {t('modify')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('confirm')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditFriendApplication(targetId, { description: applicationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
