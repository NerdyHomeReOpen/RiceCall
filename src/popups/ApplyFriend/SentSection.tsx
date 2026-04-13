import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

interface SentSectionProps {
  target: Types.User;
  onTargetNameClick: () => void;
  onModifyClick: () => void;
  onCloseClick: () => void;
}

const SentSection: React.FC<SentSectionProps> = React.memo(({ target, onTargetNameClick, onModifyClick, onCloseClick }) => {
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
          <div className="hint-text">{t('friend-application-sent')}</div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={onModifyClick}>
          {t('modify')}
        </div>
        <div className="button" onClick={onCloseClick}>
          {t('confirm')}
        </div>
      </div>
    </>
  );
});

SentSection.displayName = 'SentSection';

export default SentSection;
