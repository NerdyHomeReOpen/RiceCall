import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import popupStyles from '@/styles/Popup.module.css';

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

const SendSection: React.FC<SendSectionProps> = ({
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
            <div className={popupStyles['label']}>{t('select-friend-group')}</div>
            <div className={popupStyles['row']}>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popupStyles['select']} onChange={onFriendGroupIdChange}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popupStyles['link-text']} onClick={onCreateFriendGroup}>
                {t('create-friend-group')}
              </div>
            </div>
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

export default SendSection;
