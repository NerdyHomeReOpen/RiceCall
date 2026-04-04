import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import popupStyles from '@/styles/Popup.module.css';

interface EditSectionProps {
  target: Types.User;
  applicationDesc: string;
  onTargetNameClick: () => void;
  onApplicationDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmitClick: () => void;
  onCloseClick: () => void;
}

const EditSection: React.FC<EditSectionProps> = ({ target, applicationDesc, onTargetNameClick, onApplicationDescChange, onSubmitClick, onCloseClick }) => {
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
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={onApplicationDescChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={onSubmitClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={onCloseClick}>
          {t('cancel')}
        </div>
      </div>
    </>
  );
};

export default EditSection;
