import React, { useEffect, useRef, useState } from 'react';

// Types
import type { User, FriendApplication } from '@/types';

// CSS
import styles from '@/styles/popups/friendVerification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

interface FriendVerificationPopupProps {
  userId: User['userId'];
}

const FriendVerificationPopup: React.FC<FriendVerificationPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // State
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);

  // Handlers
  const handleRejectFriendApplication = (senderId: User['userId']) => {
    ipcService.socket.send('rejectFriendApplication', { senderId });
  };

  const handleRejectAllFriendApplication = () => {
    if (friendApplications.length === 0) return;
    handleOpenAlertDialog(t('confirm-reject-all-friend-application'), () => {
      ipcService.socket.send('rejectFriendApplication', ...friendApplications.map((item) => ({ senderId: item.senderId })));
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'alertDialog', { message, submitTo: 'alertDialog' });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleFriendApplicationAdd = (...args: { data: FriendApplication }[]) => {
    setFriendApplications((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleFriendApplicationUpdate = (...args: { senderId: string; update: Partial<FriendApplication> }[]) => {
    const update = new Map(args.map((i) => [`${i.senderId}`, i.update] as const));
    setFriendApplications((prev) => prev.map((a) => (update.has(`${a.senderId}`) ? { ...a, ...update.get(`${a.senderId}`) } : a)));
  };

  const handleFriendApplicationRemove = (...args: { senderId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.senderId}`));
    setFriendApplications((prev) => prev.filter((a) => !remove.has(`${a.senderId}`)));
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipcService.socket.on('friendApplicationAdd', handleFriendApplicationAdd),
      ipcService.socket.on('friendApplicationUpdate', handleFriendApplicationUpdate),
      ipcService.socket.on('friendApplicationRemove', handleFriendApplicationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (!userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.friendApplications({ receiverId: userId }).then((friendApplications) => {
        if (friendApplications) setFriendApplications(friendApplications);
      });
    };
    refresh();
  }, [userId]);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      <div className={popup['popup-body']} style={{ flexDirection: 'column' }}>
        {/* Content Header */}
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({friendApplications.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllFriendApplication}>
            {t('reject-all')}
          </div>
        </div>

        {/* Content Body */}
        <div className={styles['content']}>
          {friendApplications.map((friend) => {
            return (
              <div key={friend.senderId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${friend.avatarUrl})` }} onClick={() => handleOpenUserInfo(friend.receiverId, friend.senderId)} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>{friend.name}</div>
                    <div className={styles['time-text']} title={getFormatTimestamp(t, friend.createdAt)}>
                      {getFormatTimeDiff(t, friend.createdAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popup['col']}>
                      <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
                      <div className={styles['content-text']}>
                        {t('description')}: {friend.description}
                      </div>
                    </div>
                    <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div className={styles['button']} onClick={() => handleOpenApplyFriend(userId, friend.senderId)}>
                          {t('accept')}
                        </div>
                        <div className={styles['button']} onClick={() => handleRejectFriendApplication(friend.senderId)}>
                          {t('reject')}
                        </div>
                      </div>
                      <div className={styles['direct-message-button']} onClick={() => handleOpenDirectMessage(friend.receiverId, friend.senderId, friend.name)}>
                        <div className={styles['direct-message-icon']} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;
