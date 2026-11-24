import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/useStore';

import FriendActivity from './FriendActivity';

const FriendPageContent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const friendActivities = useAppSelector((state) => state.friendActivities.data, shallowEqual);

  return (
    <>
      <header className="p-[10px] text-[1rem] font-bold">{t('friend-activity')}</header>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 p-[10px] overflow-y-auto">
        <div className="flex flex-1 flex-col gap-[15px]">
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
