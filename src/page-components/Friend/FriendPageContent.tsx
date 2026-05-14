import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/useStore';

import FriendActivity from '@/components/FriendActivity';

import styles from './Friend.module.css';

const FriendPageContent: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const friendActivities = useAppSelector((state) => state.friendActivities.data, shallowEqual);

  return (
    <>
      <header className={styles['content-header']}>{t('friend-activity')}</header>
      <div className={styles['scroll-view']}>
        <div className={styles['friend-activity-list']}>
          {friendActivities.map((friendActivity, index) => (
            <FriendActivity key={index} friendActivity={friendActivity} />
          ))}
        </div>
      </div>
    </>
  );
});

FriendPageContent.displayName = 'FriendPageContent';

export default FriendPageContent;
