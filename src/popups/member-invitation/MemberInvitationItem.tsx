import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { acceptMemberInvitation, rejectMemberInvitation } from '@/services';

import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

interface MemberInvitationItemProps {
  invitation: Types.MemberInvitation;
}

const MemberInvitationItem: React.FC<MemberInvitationItemProps> = React.memo(({ invitation }) => {
  const { t } = useTranslation();

  const handleAcceptBtnClick = () => {
    acceptMemberInvitation(invitation.serverId);
  };

  const handleRejectBtnClick = () => {
    rejectMemberInvitation(invitation.serverId);
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-[45px] h-[45px] mr-[15px] cursor-pointer bg-[url('/im/SecretaryLogo.svg')] bg-center bg-cover border border-border">
        <Image src={invitation.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="sender_avatar" width={45} height={45} loading="lazy" draggable="false" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="flex items-center justify-between">
          <div className="font-bold">{invitation.name}</div>
          <div className="text-text-color-quaternary" title={getFormatTimestamp(invitation.createdAt)}>
            {getFormatTimeDiff(invitation.createdAt)}
          </div>
        </div>
        <div className="flex flex-row items-start justify-between h-[80px] p-[2px] bg-background-secondary border border-border">
          <div className="col">
            <div className="flex overflow-y-auto text-text-color-quaternary break-all">{t('invite-you-to-be-member')}</div>
            <div className="flex overflow-y-auto text-text-color-quaternary break-all">
              {t('note')}: {invitation.description}
            </div>
          </div>
          <div className="row" style={{ alignSelf: 'flex-end' }}>
            <div className="flex items-center justify-end min-w-max h-[28px] cursor-pointer">
              <div onClick={handleAcceptBtnClick}>{t('accept')}</div>
              <div onClick={handleRejectBtnClick}>{t('reject')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MemberInvitationItem.displayName = 'MemberInvitationItem';

export default MemberInvitationItem;
