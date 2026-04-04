import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Actions from '@/action';

import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

import styles from '@/styles/Verification.module.css';
import popupStyles from '@/styles/Popup.module.css';

interface MemberInvitationItemProps {
  invitation: Types.MemberInvitation;
}

const MemberInvitationItem: React.FC<MemberInvitationItemProps> = React.memo(({ invitation }) => {
  const { t } = useTranslation();

  const handleAcceptBtnClick = () => {
    Actions.acceptMemberInvitation(invitation.serverId);
  };

  const handleRejectBtnClick = () => {
    Actions.rejectMemberInvitation(invitation.serverId);
  };

  return (
    <div className={styles['application']}>
      <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${invitation.avatarUrl})` }} />
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{invitation.name}</div>
          <div className={styles['time-text']} title={getFormatTimestamp(t, invitation.createdAt)}>
            {getFormatTimeDiff(t, invitation.createdAt)}
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

export default MemberInvitationItem;
