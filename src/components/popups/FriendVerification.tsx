import React, { useEffect, useState } from 'react';

// Types
import type { User, FriendApplication } from '@/types';

// CSS
import styles from '@/styles/popups/friendVerification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

interface FriendVerificationPopupProps {
  userId: User['userId'];
  friendApplications: FriendApplication[];
}

const FriendVerificationPopup: React.FC<FriendVerificationPopupProps> = React.memo(({ userId, friendApplications: friendApplicationsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>(friendApplicationsData);

  // Handlers
  const handleRejectFriendApplication = (senderId: User['userId'], applicationName: FriendApplication['name']) => {
    handleOpenAlertDialog(t('confirm-reject-friend-application', { 0: applicationName }), () => {
      ipc.socket.send('rejectFriendApplication', { senderId });
    });
  };

  const handleRejectAllFriendApplication = () => {
    if (friendApplications.length === 0) return;
    handleOpenAlertDialog(t('confirm-reject-all-friend-application'), () => {
      ipc.socket.send('rejectFriendApplication', ...friendApplications.map((item) => ({ senderId: item.senderId })));
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
  };

  const handleOpenApproveFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
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
      ipc.socket.on('friendApplicationAdd', handleFriendApplicationAdd),
      ipc.socket.on('friendApplicationUpdate', handleFriendApplicationUpdate),
      ipc.socket.on('friendApplicationRemove', handleFriendApplicationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

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
          {friendApplications.map((friendApplication) => {
            const { senderId: applicationSenderId, name: applicationName, avatarUrl: applicationAvatarUrl, createdAt: applicationCreatedAt, description: applicationDescription } = friendApplication;
            return (
              <div key={applicationSenderId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${applicationAvatarUrl})` }} onClick={() => handleOpenUserInfo(userId, applicationSenderId)} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>{applicationName}</div>
                    <div className={styles['time-text']} title={getFormatTimestamp(t, applicationCreatedAt)}>
                      {getFormatTimeDiff(t, applicationCreatedAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popup['col']}>
                      <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
                      <div className={styles['content-text']}>
                        {t('note')}: {applicationDescription}
                      </div>
                    </div>
                    <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div className={styles['button']} onClick={() => handleOpenApproveFriend(userId, applicationSenderId)}>
                          {t('accept')}
                        </div>
                        <div className={styles['button']} onClick={() => handleRejectFriendApplication(applicationSenderId, applicationName)}>
                          {t('reject')}
                        </div>
                      </div>
                      <div className={styles['direct-message-button']} onClick={() => handleOpenDirectMessage(userId, applicationSenderId)}>
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
