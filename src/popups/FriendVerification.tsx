import React from 'react';
import { shallowEqual } from 'react-redux';
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
  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);

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
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  // Handlers
  const handleSenderAvatarClick = () => {
    Popup.openUserInfo(user.userId, application.senderId);
  };

  const handleAcceptBtnClick = () => {
    Popup.openApproveFriend(user.userId, application.senderId);
  };

  const handleRejectBtnClick = () => {
    Popup.rejectFriendApplication(user.userId, application.name);
  };

  const handleDirectMessageBtnClick = () => {
    Popup.openDirectMessage(user.userId, application.senderId);
  };

  return (
    <div className={styles['application']}>
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${application.avatarUrl})` }} onClick={handleSenderAvatarClick} />
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{application.name}</div>
          <div className={styles['time-text']} title={Language.getFormatTimestamp(t, application.createdAt)}>
            {Language.getFormatTimeDiff(t, application.createdAt)}
          </div>
        </div>
        <div className={styles['application-content-box']}>
          <div className={popupStyles['col']}>
            <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
            <div className={styles['content-text']}>
              {t('note')}: {application.description}
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
