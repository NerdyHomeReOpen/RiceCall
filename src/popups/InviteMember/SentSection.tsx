import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './InviteMember.module.css';

interface SentSectionProps {
  receiverMember: Types.Member;
  onModifyBtnClick: () => void;
  onConfirmBtnClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = React.memo(({ receiverMember, onModifyBtnClick, onConfirmBtnClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('invite-member-label')}</div>
          <div className="row">
            <div className={styles['member-avatar']}>
              <Image src={receiverMember.avatarUrl} alt="receiver_avatar" width={40} height={40} loading="lazy" draggable="false" />
            </div>
            <div className={styles['member-info']}>
              <div className="link-text">
                {receiverMember.name} ({receiverMember.displayId})
              </div>
              <div className="sub-text">
                {t('contribution')}: {receiverMember.contribution}
              </div>
            </div>
          </div>
          <div className={styles['split']} />
          <div className="hint-text">{t('member-invitation-sent')}</div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={onModifyBtnClick}>
          {t('modify')}
        </div>
        <div className="button" onClick={onConfirmBtnClick}>
          {t('confirm')}
        </div>
      </div>
    </>
  );
});

SentSection.displayName = 'SentSection';

export default SentSection;
