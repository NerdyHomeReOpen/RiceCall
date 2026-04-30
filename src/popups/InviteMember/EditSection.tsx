import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './InviteMember.module.css';

interface EditSectionProps {
  target: Types.Member;
  invitationDesc: string;
  onInvitationDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmitBtnClick: () => void;
  onCancelBtnClick: () => void;
}

const EditSection: React.FC<EditSectionProps> = React.memo(({ target, invitationDesc, onInvitationDescChange, onSubmitBtnClick, onCancelBtnClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('invite-member-label')}</div>
          <div className="row">
            <div className={styles['member-avatar']}>
              <Image src={target.avatarUrl} alt="target_avatar" width={40} height={40} loading="lazy" draggable="false" />
            </div>
            <div className={styles['member-info']}>
              <div className="link-text">
                {target.name} ({target.displayId})
              </div>
              <div className="sub-text">
                {t('contribution')}: {target.contribution}
              </div>
            </div>
          </div>
          <div className={styles['split']} />
          <div className="input-box col">
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={onInvitationDescChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={onSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className="button" onClick={onCancelBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </>
  );
});

EditSection.displayName = 'EditSection';

export default EditSection;
