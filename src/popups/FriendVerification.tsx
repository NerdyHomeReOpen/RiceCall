import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';

import styles from '@/styles/verification.module.css';
import popupStyles from '@/styles/popup.module.css';

const FriendVerificationPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const friendApplications = useAppSelector((state) => state.friendApplications.data);

  // Handlers
  const handleRejectAllBtnClick = () => {
    Popup.rejectAllFriendApplication(friendApplications);
  };

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']} style={{ flexDirection: 'column' }}>
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({friendApplications.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllBtnClick}>
            {t('reject-all')}
          </div>
        </div>
        <div className={styles['content']}>
          {friendApplications.map((application) => (
            <FriendApplicationItem key={application.senderId} application={application} />
          ))}
        </div>
      </div>
    </div>
  );
});

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;

interface FriendApplicationItemProps {
  application: Types.FriendApplication;
}

const FriendApplicationItem: React.FC<FriendApplicationItemProps> = React.memo(({ application }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Variables
  const { userId } = user;
  const { senderId, avatarUrl: senderAvatarUrl, name: senderName, createdAt: applicationCreatedAt, description: applicationDescription } = application;

  // Handlers
  const handleSenderAvatarClick = () => {
    Popup.openUserInfo(userId, senderId);
  };

  const handleAcceptBtnClick = () => {
    Popup.openApproveFriend(userId, senderId);
  };

  const handleRejectBtnClick = () => {
    Popup.rejectFriendApplication(userId, senderName);
  };

  const handleDirectMessageBtnClick = () => {
    Popup.openDirectMessage(userId, senderId);
  };

  return (
    <div key={senderId} className={styles['application']}>
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${senderAvatarUrl})` }} onClick={handleSenderAvatarClick} />
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
              <div className={styles['button']} onClick={handleAcceptBtnClick}>
                {t('accept')}
              </div>
              <div className={styles['button']} onClick={handleRejectBtnClick}>
                {t('reject')}
              </div>
            </div>
            <div className={styles['direct-message-button']} onClick={handleDirectMessageBtnClick}>
              <div className={styles['direct-message-icon']} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendApplicationItem.displayName = 'FriendApplicationItem';
