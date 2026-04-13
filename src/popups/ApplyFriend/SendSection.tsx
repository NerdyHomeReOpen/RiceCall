import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

interface SendSectionProps {
  target: Types.User;
  friendGroups: Types.FriendGroup[];
  friendGroupId: string;
  applicationDesc: string;
  onTargetNameClick: () => void;
  onFriendGroupIdChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onApplicationDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCreateFriendGroup: () => void;
  onSubmitClick: () => void;
  onCloseClick: () => void;
}

const SendSection: React.FC<SendSectionProps> = React.memo(({
  target,
  friendGroups,
  applicationDesc,
  onTargetNameClick,
  onFriendGroupIdChange,
  onApplicationDescChange,
  onCreateFriendGroup,
  onSubmitClick,
  onCloseClick,
}) => {
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
            <div className="label">{t('select-friend-group')}</div>
            <div className="row">
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select" onChange={onFriendGroupIdChange}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="link-text" onClick={onCreateFriendGroup}>
                {t('create-friend-group')}
              </div>
            </div>
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

SendSection.displayName = 'SendSection';

export default SendSection;
