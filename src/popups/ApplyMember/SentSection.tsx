import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './ApplyMember.module.css';

interface SentSectionProps {
  server: Types.Server;
  onServerNameLinkClick: () => void;
  onModifyBtnClick: () => void;
  onConfirmBtnClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = React.memo(({ server, onServerNameLinkClick, onModifyBtnClick, onConfirmBtnClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="row">
            <div className={styles['server-avatar']}>
              <Image src={server.avatarUrl} alt="server_avatar" width={40} height={40} loading="lazy" draggable="false" />
            </div>
            <div className={styles['server-info']}>
              <div className="link-text" onClick={onServerNameLinkClick}>
                {server.name}
              </div>
              <div className="sub-text">{`ID: ${server.specialId || server.displayId}`}</div>
            </div>
          </div>
          <div className="input-box col">
            <div className="label">{t('apply-member-note')}</div>
            <div className="hint-text">{server.applyNotice || t('none')}</div>
          </div>
          <div className={styles['split']} />
          <div className="hint-text">{t('member-application-sent')}</div>
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
