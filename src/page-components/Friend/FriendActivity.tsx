import React from 'react';
import Image from 'next/image';

import * as Types from '@/types';

import { openUserInfo } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import { getFormatTimeDiff } from '@/utils/language';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

import styles from './Friend.module.css';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const userId = useAppSelector((state) => state.user.data.userId);

  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    openUserInfo(userId, friendActivity.userId);
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
          <div className={styles['timestamp-text']}>{getFormatTimeDiff(friendActivity.timestamp)}</div>
        </div>
        <div className={styles['friend-activity-content-bottom']}>{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

export default FriendActivity;
