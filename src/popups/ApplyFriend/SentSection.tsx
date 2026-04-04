import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import popupStyles from '@/styles/Popup.module.css';

interface SentSectionProps {
  target: Types.User;
  onTargetNameClick: () => void;
  onModifyClick: () => void;
  onCloseClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = ({ target, onTargetNameClick, onModifyClick, onCloseClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['label']}>{t('apply-friend-label')}</div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${target.avatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']} onClick={onTargetNameClick}>
                {target.name}
              </div>
              <div className={popupStyles['sub-text']}>{target.displayId}</div>
            </div>
          </div>
          <div className={popupStyles['split']} />
          <div className={popupStyles['hint-text']}>{t('friend-application-sent')}</div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={onModifyClick}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={onCloseClick}>
          {t('confirm')}
        </div>
      </div>
    </>
  );
};

export default SentSection;
