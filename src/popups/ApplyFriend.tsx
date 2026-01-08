import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface ApplyFriendPopupProps {
  target: Types.User;
  friendApplication: Types.FriendApplication | null;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ target, friendApplication }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  // States
  const [section, setSection] = useState<number>(friendApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');
  const [applicationDesc, setApplicationDesc] = useState<Types.FriendApplication['description']>(friendApplication?.description || '');

  // Variables
  const isSendSection = section === 0;
  const isSentSection = section === 1;
  const isEditSection = section === 2;

  // Handlers
  const handleTargetNameClick = () => {
    Popup.openUserInfo(user.userId, target.userId);
  };

  const handleCreateFriendGroupBtnClick = () => {
    Popup.openCreateFriendGroup();
  };

  const handleApplicationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApplicationDesc(e.target.value);
  };

  const handleFriendGroupIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFriendGroupId(e.target.value);
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitBtnClick = () => {
    Popup.sendFriendApplication(target.userId, { description: applicationDesc }, friendGroupId || null);
    ipc.window.close();
  };

  const handleSubmitEditBtnClick = () => {
    Popup.editFriendApplication(target.userId, { description: applicationDesc });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['label']}>{t('apply-friend-label')}</div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['avatar-wrapper']}>
              <div className={popupStyles['avatar-picture']} style={{ backgroundImage: `url(${target.avatarUrl})` }} />
            </div>
            <div className={popupStyles['info-wrapper']}>
              <div className={popupStyles['link-text']} onClick={handleTargetNameClick}>
                {target.name}
              </div>
              <div className={popupStyles['sub-text']}>{target.displayId}</div>
            </div>
          </div>
          <div className={popupStyles['split']} />
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={isSendSection ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('select-friend-group')}</div>
            <div className={popupStyles['row']}>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popupStyles['select']} onChange={handleFriendGroupIdChange}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popupStyles['link-text']} onClick={handleCreateFriendGroupBtnClick}>
                {t('create-friend-group')}
              </div>
            </div>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
          <div className={popupStyles['hint-text']} style={isSentSection ? {} : { display: 'none' }}>
            {t('friend-application-sent')}
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={isEditSection ? {} : { display: 'none' }}>
            <div className={popupStyles['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={handleApplicationDescChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isSendSection ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleSubmitBtnClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isSentSection ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleModifyBtnClick}>
          {t('modify')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('confirm')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isEditSection ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleSubmitEditBtnClick}>
          {t('submit')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
