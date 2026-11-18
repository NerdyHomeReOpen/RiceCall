import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import { getFormatTimeDiff } from '@/utils/language';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

import styles from './friend.module.css';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    openUserInfo(friendActivity.userId);
  };

  return (
    <div className={styles['friend-activity-item']}>
      <div className={styles['friend-activity-avatar']}>
        <Image src={friendActivity.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="friend_avatar" width={30} height={30} loading="lazy" draggable="false" />
      </div>
      <div className={styles['friend-activity-content']}>
        <div className={styles['friend-activity-content-top']}>
          {hasVip && <div className={`vip-icon vip-${friendActivity.vip}`} />}
          <div className={styles['name-text']} onClick={handleUserNameClick}>
            {friendActivity.name}
          </div>
          <div className={styles['timestamp-text']}>{getFormatTimeDiff(friendActivity.occurredAt)}</div>
        </div>
        <div className={styles['friend-activity-content-bottom']}>{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

export default FriendActivity;
