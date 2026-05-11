import React from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import { useAppSelector } from '@/hooks/Store';

import { getFormatTimeDiff } from '@/utils/language';

import styles from './FriendActivity.module.css';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    openUserInfo(user.userId, friendActivity.userId);
  };

  return (
    <div className={styles['activity-item']}>
      <div className={styles['avatar']}>
        <Image src={friendActivity.avatarUrl} alt="friend_avatar" width={30} height={30} loading="lazy" draggable="false" />
      </div>
      <div className={styles['content']}>
        <div className={styles['content-top']}>
          {hasVip && <div className={`vip-icon vip-${friendActivity.vip}`} />}
          <div className={styles['name-text']} onClick={handleUserNameClick}>
            {friendActivity.name}
          </div>
          <div className={styles['timestamp-text']}>{getFormatTimeDiff(friendActivity.timestamp)}</div>
        </div>
        <div className={styles['content-bottom']}>{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

export default FriendActivity;
