import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { FriendApplication, FriendGroup, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface ApplyFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ userId, targetId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [section, setSection] = useState<number>(0);
  const [target, setTarget] = useState<User>(Default.user());
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplication, setFriendApplication] = useState<FriendApplication>(Default.friendApplication());
  const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<FriendGroup['friendGroupId'] | null>(null);

  // Variables
  const { name: targetName, avatarUrl: targetAvatarUrl } = target;
  const { description: applicationDesc } = friendApplication;

  // Handlers
  const handleSendFriendApplication = (receiverId: User['userId'], preset: Partial<FriendApplication>) => {
    ipcService.socket.send('sendFriendApplication', { receiverId, preset });
  };

  const handleApproveFriendApplication = (senderId: User['userId']) => {
    ipcService.socket.send('approveFriendApplication', { senderId });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenCreateFriendGroup = () => {
    ipcService.popup.open('createFriendGroup', 'createFriendGroup', {});
  };

  const handleClose = () => {
    ipcService.window.close();
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
      ipcService.socket.on('friendGroupAdd', handleFriendGroupAdd),
      ipcService.socket.on('friendGroupUpdate', handleFriendGroupUpdate),
      ipcService.socket.on('friendGroupRemove', handleFriendGroupRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (!userId || !targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: targetId }).then((target) => {
        if (target) setTarget(target);
      });
      getService.friendGroups({ userId: userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      getService.friendApplication({ receiverId: userId, senderId: targetId }).then((sentFriendApplication) => {
        if (sentFriendApplication) {
          setSection(1);
          setFriendApplication(sentFriendApplication);
        }
      });
      getService.friendApplication({ receiverId: targetId, senderId: userId }).then((receivedFriendApplication) => {
        if (receivedFriendApplication) {
          setSection(2);
          setFriendApplication(receivedFriendApplication);
        }
      });
    };
    refresh();
  }, [userId, targetId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['label']}>{t('friend-label')}</div>
          <div className={popup['row']} onClick={() => handleOpenUserInfo(userId, targetId)}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['bold-text']}>{targetName}</div>
              <div className={popup['sub-text']}>{targetName}</div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('friend-note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setFriendApplication((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('friend-apply-sent')}
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('friend-select-group')}</div>
            <div className={popup['row']}>
              <div className={popup['select-box']}>
                <select className={popup['select']} value={selectedFriendGroupId || ''} onChange={(e) => setSelectedFriendGroupId(e.target.value)}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popup['link-text']} onClick={handleOpenCreateFriendGroup}>
                {t('friend-add-group')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleSendFriendApplication(targetId, { description: applicationDesc });
            handleClose();
          }}
        >
          {t('send-request')}
        </div>
        <div className={popup['button']} style={section === 0 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => setSection(0)}>
          {t('modify')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('confirm')}
        </div>
        <div
          className={popup['button']}
          style={section === 2 ? {} : { display: 'none' }}
          onClick={() => {
            handleApproveFriendApplication(targetId);
            handleClose();
          }}
        >
          {t('add')}
        </div>
        <div className={popup['button']} style={section === 2 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
