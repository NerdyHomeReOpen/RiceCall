import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

import MemberInvitationItem from './MemberInvitationItem';

import styles from '@/styles/Verification.module.css';
import popupStyles from '@/styles/Popup.module.css';

const MemberInvitationPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);

  const handleRejectAllBtnClick = () => {
    Actions.rejectAllMemberInvitation(memberInvitations);
  };

  return (
    <div className={popupStyles['popup-wrapper']} tabIndex={0}>
      <div className={popupStyles['popup-body']} style={{ flexDirection: 'column' }}>
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({memberInvitations.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllBtnClick}>
            {t('reject-all')}
          </div>
        </div>
        <div className={styles['content']}>
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
