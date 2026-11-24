import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import { getFormatTimeDiff } from '@/utils/language';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    openUserInfo(friendActivity.userId);
  };

  return (
    <div className="flex flex-row gap-[10px] items-center w-full">
      <div className="w-[30px] h-[30px]">
        <Image src={friendActivity.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="friend_avatar" width={30} height={30} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-1 flex-col justify-between w-full overflow-hidden">
        <div className="flex flex-row gap-[3px] items-center justify-between w-full min-w-0">
          {hasVip && <div className={`vip-icon vip-${friendActivity.vip} shrink-0`} />}
          <div className="shrink-0 truncate text-text-username cursor-pointer hover:underline" onClick={handleUserNameClick}>
            {friendActivity.name}
          </div>
          <div className="shrink-0 ml-auto text-text-color-quinary">{getFormatTimeDiff(friendActivity.occurredAt)}</div>
        </div>
        <div className="max-w-full min-h-[18px] truncate text-text-color-quaternary select-text">{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

export default FriendActivity;
