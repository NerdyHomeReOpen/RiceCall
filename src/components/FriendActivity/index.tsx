import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

import { getFormatTimeDiff } from '@/utils/language';

import styles from './FriendActivity.module.css';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    Actions.openUserInfo(user.userId, friendActivity.userId);
  };

  return (
    <div className={styles['friend-activity']}>
      <div className={styles['friend-activity-avatar']}>
        <Image src={friendActivity.avatarUrl} alt="friend_avatar" width={30} height={30} loading="lazy" draggable="false" />
      </div>
      <div className={styles['friend-activity-content']}>
        <div className={styles['friend-activity-content-top']}>
          {hasVip && <div className={`vip-icon vip-${friendActivity.vip}`} />}
          <div className={styles['friend-name-text']} onClick={handleUserNameClick}>
            {friendActivity.name}
          </div>
          <div className={styles['friend-activity-timestamp-text']}>{getFormatTimeDiff(t, friendActivity.timestamp)}</div>
        </div>
        <div className={styles['friend-activity-content-bottom']}>{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

export default FriendActivity;
