import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';

import styles from '@/styles/verification.module.css';
import popupStyles from '@/styles/popup.module.css';

const MemberInvitationPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);

  // Handlers
  const handleRejectAllBtnClick = () => {
    Popup.rejectAllMemberInvitation(memberInvitations);
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

interface MemberInvitationItemProps {
  invitation: Types.MemberInvitation;
}

const MemberInvitationItem: React.FC<MemberInvitationItemProps> = React.memo(({ invitation }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleAcceptBtnClick = () => {
    Popup.acceptMemberInvitation(invitation.serverId);
  };

  const handleRejectBtnClick = () => {
    Popup.rejectMemberInvitation(invitation.serverId);
  };

  return (
    <div className={styles['application']}>
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${invitation.avatarUrl})` }} />
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{invitation.name}</div>
          <div className={styles['time-text']} title={Language.getFormatTimestamp(t, invitation.createdAt)}>
            {Language.getFormatTimeDiff(t, invitation.createdAt)}
          </div>
        </div>
        <div className={styles['application-content-box']}>
          <div className={popupStyles['col']}>
            <div className={styles['content-text']}>{t('invite-you-to-be-member')}</div>
            <div className={styles['content-text']}>
              {t('note')}: {invitation.description}
            </div>
          </div>
          <div className={popupStyles['row']} style={{ alignSelf: 'flex-end' }}>
            <div className={styles['action-buttons']}>
              <div className={styles['button']} onClick={handleAcceptBtnClick}>
                {t('accept')}
              </div>
              <div className={styles['button']} onClick={handleRejectBtnClick}>
                {t('reject')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MemberInvitationItem.displayName = 'MemberInvitationItem';
