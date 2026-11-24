import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { rejectAllMemberInvitation } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import MemberInvitationItem from './MemberInvitationItem';

const MemberInvitationPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);

  const handleRejectAllBtnClick = () => {
    rejectAllMemberInvitation(memberInvitations);
  };

  return (
    <div className="popup-wrapper" tabIndex={0}>
      <div className="popup-body" style={{ flexDirection: 'column' }}>
        <div className="z-1 flex justify-between w-full p-[10px]">
          <div>
            {t('unprocessed')}
            <span>({memberInvitations.length})</span>
          </div>
          <div className="cursor-pointer hover:text-text-color-quaternary active:text-text-color-senary" onClick={handleRejectAllBtnClick}>
            {t('reject-all')}
          </div>
        </div>
        <div className="flex flex-col gap-[5px] items-center justify-start w-full h-auto p-[15px] overflow-y-scroll">
          {memberInvitations.map((invitation) => (
            <MemberInvitationItem key={invitation.serverId} invitation={invitation} />
          ))}
        </div>
      </div>
    </div>
  );
});

MemberInvitationPopup.displayName = 'MemberInvitationPopup';

export default MemberInvitationPopup;
