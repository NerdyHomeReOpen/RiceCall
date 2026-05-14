import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { rejectAllFriendApplication, openApproveFriend, openDirectMessage, openUserInfo, rejectFriendApplication } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

import styles from './FriendVerification.module.css';

const FriendVerificationPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);

  const handleRejectAllBtnClick = () => {
    rejectAllFriendApplication(friendApplications);
  };

  return (
    <div className="popup-wrapper" tabIndex={0}>
      <div className="popup-body" style={{ flexDirection: 'column' }}>
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
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const handleSenderAvatarClick = () => {
    openUserInfo(user.userId, application.senderId);
  };

  const handleAcceptBtnClick = () => {
    openApproveFriend(user.userId, application.senderId);
  };

  const handleRejectBtnClick = () => {
    rejectFriendApplication(application.senderId, application.name);
  };

  const handleDirectMessageBtnClick = () => {
    openDirectMessage(user.userId, application.senderId);
  };

  return (
    <div className={styles['application']}>
      <div className={styles['avatar-picture']} onClick={handleSenderAvatarClick}>
        <Image src={application.avatarUrl} alt="sender_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{application.name}</div>
          <div className={styles['time-text']} title={getFormatTimestamp(application.createdAt)}>
            {getFormatTimeDiff(application.createdAt)}
          </div>
        </div>
        <div className={styles['application-content-box']}>
          <div className="col">
            <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
            <div className={styles['content-text']}>
              {t('note')}: {application.description}
            </div>
          </div>
          <div className="row" style={{ alignSelf: 'flex-end' }}>
            <div className={styles['action-buttons']}>
              <div className={styles['action-button']} onClick={handleAcceptBtnClick}>
                {t('accept')}
              </div>
              <div className={styles['action-button']} onClick={handleRejectBtnClick}>
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
