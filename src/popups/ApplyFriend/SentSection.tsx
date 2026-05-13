import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './ApplyFriend.module.css';

interface SentSectionProps {
  receiver: Types.User;
  onReceiverNameClick: () => void;
  onModifyBtnClick: () => void;
  onConfirmBtnClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = React.memo(({ receiver, onReceiverNameClick, onModifyBtnClick, onConfirmBtnClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('apply-friend-label')}</div>
          <div className="row">
            <div className={styles['user-avatar']}>
              <Image src={receiver.avatarUrl} alt="receiver_avatar" width={40} height={40} loading="lazy" draggable="false" />
            </div>
            <div className={styles['user-info']}>
              <div className="link-text" onClick={onReceiverNameClick}>
                {receiver.name}
              </div>
              <div className="sub-text">{receiver.displayId}</div>
            </div>
          </div>
          <div className={styles['split']} />
          <div className="hint-text">{t('friend-application-sent')}</div>
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
