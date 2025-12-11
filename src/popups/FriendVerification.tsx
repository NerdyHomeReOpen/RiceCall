import React, { useEffect, useState } from 'react';

// Types
import type { User, FriendApplication } from '@/types';

// CSS
import styles from '@/styles/verification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { handleOpenAlertDialog, handleOpenDirectMessage, handleOpenApproveFriend, handleOpenUserInfo } from '@/utils/popup';
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

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationAdd', (...args: { data: FriendApplication }[]) => {
      const add = new Set(args.map((i) => `${i.data.senderId}`));
      setFriendApplications((prev) => prev.filter((a) => !add.has(`${a.senderId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args: { senderId: string; update: Partial<FriendApplication> }[]) => {
      const update = new Map(args.map((i) => [`${i.senderId}`, i.update] as const));
      setFriendApplications((prev) => prev.map((a) => (update.has(`${a.senderId}`) ? { ...a, ...update.get(`${a.senderId}`) } : a)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationRemove', (...args: { senderId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.senderId}`));
      setFriendApplications((prev) => prev.filter((a) => !remove.has(`${a.senderId}`)));
    });
    return () => unsub();
  }, []);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      <div className={popup['popup-body']} style={{ flexDirection: 'column' }}>
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({friendApplications.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllFriendApplication}>
            {t('reject-all')}
          </div>
        </div>
        <div className={styles['content']}>
          {friendApplications.map((friendApplication) => (
            <div key={friendApplication.senderId} className={styles['application']}>
              <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${friendApplication.avatarUrl})` }} onClick={() => handleOpenUserInfo(userId, friendApplication.senderId)} />
              <div style={{ flex: 1 }}>
                <div className={styles['user-info-box']}>
                  <div className={styles['user-name-text']}>{friendApplication.name}</div>
                  <div className={styles['time-text']} title={getFormatTimestamp(t, friendApplication.createdAt)}>
                    {getFormatTimeDiff(t, friendApplication.createdAt)}
                  </div>
                </div>
                <div className={styles['application-content-box']}>
                  <div className={popup['col']}>
                    <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
                    <div className={styles['content-text']}>
                      {t('note')}: {friendApplication.description}
                    </div>
                  </div>
                  <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                    <div className={styles['action-buttons']}>
                      <div className={styles['button']} onClick={() => handleOpenApproveFriend(userId, friendApplication.senderId)}>
                        {t('accept')}
                      </div>
                      <div className={styles['button']} onClick={() => handleRejectFriendApplication(friendApplication.senderId, friendApplication.name)}>
                        {t('reject')}
                      </div>
                    </div>
                    <div className={styles['direct-message-button']} onClick={() => handleOpenDirectMessage(userId, friendApplication.senderId)}>
                      <div className={styles['direct-message-icon']} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;
