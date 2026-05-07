import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { acceptMemberInvitation, rejectMemberInvitation } from '@/services';

import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

import styles from './MemberInvitation.module.css';

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
    <div className={styles['application']}>
      <div className={styles['avatar-picture']}>
        <Image src={invitation.avatarUrl} alt="sender_avatar" width={45} height={45} loading="lazy" draggable="false" />
      </div>
      <div style={{ flex: 1 }}>
        <div className={styles['user-info-box']}>
          <div className={styles['user-name-text']}>{invitation.name}</div>
          <div className={styles['time-text']} title={getFormatTimestamp(invitation.createdAt)}>
            {getFormatTimeDiff(invitation.createdAt)}
          </div>
        </div>
        <div className={styles['application-content-box']}>
          <div className="col">
            <div className={styles['content-text']}>{t('invite-you-to-be-member')}</div>
            <div className={styles['content-text']}>
              {t('note')}: {invitation.description}
            </div>
          </div>
          <div className="row" style={{ alignSelf: 'flex-end' }}>
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
