import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

interface EditSectionProps {
  target: Types.User;
  applicationDesc: string;
  onTargetNameClick: () => void;
  onApplicationDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmitClick: () => void;
  onCloseClick: () => void;
}

const EditSection: React.FC<EditSectionProps> = React.memo(({ target, applicationDesc, onTargetNameClick, onApplicationDescChange, onSubmitClick, onCloseClick }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="popup-body">
        <div className="popup-content col">
          <div className="label">{t('apply-friend-label')}</div>
          <div className="row">
            <div className="avatar-picture">
              <Image src={target.avatarUrl} alt="target_avatar" width={40} height={40} loading="lazy" draggable="false" />
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
});

EditSection.displayName = 'EditSection';

export default EditSection;
