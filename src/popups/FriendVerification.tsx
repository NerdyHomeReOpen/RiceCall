import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';

import styles from '@/styles/verification.module.css';
import popupStyles from '@/styles/popup.module.css';

interface FriendVerificationPopupProps {
  userId: Types.User['userId'];
  friendApplications: Types.FriendApplication[];
}

const FriendVerificationPopup: React.FC<FriendVerificationPopupProps> = React.memo(({ userId, friendApplications: friendApplicationsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendApplications, setFriendApplications] = useState<Types.FriendApplication[]>(friendApplicationsData);

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationAdd', (...args: { data: Types.FriendApplication }[]) => {
      const add = new Set(args.map((i) => `${i.data.senderId}`));
      setFriendApplications((prev) => prev.filter((a) => !add.has(`${a.senderId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args: { senderId: string; update: Partial<Types.FriendApplication> }[]) => {
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
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']} style={{ flexDirection: 'column' }}>
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({friendApplications.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={() => Popup.rejectAllFriendApplication(friendApplications)}>
            {t('reject-all')}
          </div>
        </div>
        <div className={styles['content']}>
          {friendApplications.map((application) => {
            const { senderId, avatarUrl: senderAvatarUrl, name: senderName, createdAt: applicationCreatedAt, description: applicationDescription } = application;
            return (
              <div key={senderId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${senderAvatarUrl})` }} onClick={() => Popup.openUserInfo(userId, senderId)} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>{senderName}</div>
                    <div className={styles['time-text']} title={Language.getFormatTimestamp(t, applicationCreatedAt)}>
                      {Language.getFormatTimeDiff(t, applicationCreatedAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popupStyles['col']}>
                      <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
                      <div className={styles['content-text']}>
                        {t('note')}: {applicationDescription}
                      </div>
                    </div>
                    <div className={popupStyles['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div className={styles['button']} onClick={() => Popup.openApproveFriend(userId, senderId)}>
                          {t('accept')}
                        </div>
                        <div className={styles['button']} onClick={() => Popup.rejectFriendApplication(senderId, senderName)}>
                          {t('reject')}
                        </div>
                      </div>
                      <div className={styles['direct-message-button']} onClick={() => Popup.openDirectMessage(userId, senderId)}>
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
