import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { rejectAllFriendApplication, openApproveFriend, openDirectMessage, openUserInfo, rejectFriendApplication } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

const FriendVerificationPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);

  const handleRejectAllBtnClick = () => {
    rejectAllFriendApplication(friendApplications);
  };

  return (
    <div className="popup-wrapper" tabIndex={0}>
      <div className="popup-body" style={{ flexDirection: 'column' }}>
        <div className="z-1 flex justify-between w-full p-[10px]">
          <div>
            {t('unprocessed')}
            <span>({friendApplications.length})</span>
          </div>
          <div className="cursor-pointer hover:text-text-color-quaternary active:text-text-color-senary" onClick={handleRejectAllBtnClick}>
            {t('reject-all')}
          </div>
        </div>
        <div className="flex flex-col gap-[5px] items-center justify-start w-full h-auto p-[15px] overflow-y-scroll">
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

  const handleSenderAvatarClick = () => {
    openUserInfo(application.senderId);
  };

  const handleAcceptBtnClick = () => {
    openApproveFriend(application.senderId);
  };

  const handleRejectBtnClick = () => {
    rejectFriendApplication(application.senderId, application.name);
  };

  const handleDirectMessageBtnClick = () => {
    openDirectMessage(application.senderId);
  };

  return (
    <div className="flex justify-center w-full">
      <div className="relative w-[40px] h-[40px] mr-[15px] cursor-pointer" onClick={handleSenderAvatarClick}>
        <Image src={application.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="sender_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="flex items-center justify-between">
          <div className="font-bold">{application.name}</div>
          <div className="text-text-color-quaternary" title={getFormatTimestamp(application.createdAt)}>
            {getFormatTimeDiff(application.createdAt)}
          </div>
        </div>
        <div className="flex flex-row items-start justify-between h-[80px] p-[2px] bg-background-secondary border border-border">
          <div className="col">
            <div className="flex overflow-y-auto text-text-color-quaternary break-all">{t('request-to-add-you-as-a-friend')}</div>
            <div className="flex overflow-y-auto text-text-color-quaternary break-all">
              {t('note')}: {application.description}
            </div>
          </div>
          <div className="row" style={{ alignSelf: 'flex-end' }}>
            <div className="flex items-center justify-end min-w-max h-[28px] cursor-pointer">
              <div className="flex items-center justify-center h-[23px] p-[3px] mb-[2px] bg-background border border-border hover:bg-hover active:bg-selected" onClick={handleAcceptBtnClick}>
                {t('accept')}
              </div>
              <div className="flex items-center justify-center h-[23px] p-[3px] mb-[2px] bg-background border border-border hover:bg-hover active:bg-selected" onClick={handleRejectBtnClick}>
                {t('reject')}
              </div>
            </div>
            <div className="w-[30px] h-[28px] cursor-pointer" onClick={handleDirectMessageBtnClick}>
              <div className="w-full h-full bg-[url('/icon_notice_chat.svg')] bg-position-[0_0] bg-auto hover:bg-position-[-30px_0] active:bg-position-[-60px_0]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendApplicationItem.displayName = 'FriendApplicationItem';
