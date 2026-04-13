import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

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
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('apply-friend-label')}</div>
          <div className="row">
            <div className="avatar-wrapper">
              <div className="avatar-picture" style={{ backgroundImage: `url(${target.avatarUrl})` }} />
            </div>
            <div className="info-wrapper">
              <div className="link-text" onClick={onTargetNameClick}>
                {target.name}
              </div>
              <div className="sub-text">{target.displayId}</div>
            </div>
          </div>
          <div className="split" />
          <div className="input-box col">
            <div className="label">{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={onApplicationDescChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={onSubmitClick}>
          {t('submit')}
        </div>
        <div className="button" onClick={onCloseClick}>
          {t('cancel')}
        </div>
      </div>
    </>
  );
};

export default EditSection;
