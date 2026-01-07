import React from 'react';
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
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data);

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

function MemberInvitationItem({ invitation }: { invitation: Types.MemberInvitation }) {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { serverId, avatarUrl: serverAvatarUrl, name: serverName, createdAt: invitationCreatedAt, description: invitationDescription } = invitation;

  // Handlers
  const handleAcceptBtnClick = () => {
    Popup.acceptMemberInvitation(serverId);
  };

  const handleRejectBtnClick = () => {
    Popup.rejectMemberInvitation(serverId);
  };

  return (
    <div className={styles['application']}>
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{serverName}</div>
          <div className={styles['time-text']} title={Language.getFormatTimestamp(t, invitationCreatedAt)}>
            {Language.getFormatTimeDiff(t, invitationCreatedAt)}
          </div>
        </div>
        <div className={styles['application-content-box']}>
          <div className={popupStyles['col']}>
            <div className={styles['content-text']}>{t('invite-you-to-be-member')}</div>
            <div className={styles['content-text']}>
              {t('note')}: {invitationDescription}
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
}
