import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface ApproveFriendPopupProps {
  targetId: Types.User['userId'];
}

const ApproveFriendPopup: React.FC<ApproveFriendPopupProps> = React.memo(({ targetId }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const friendGroups = useAppSelector((state) => state.friendGroups.data);

  // States
  const [friendNotes, setFriendNotes] = useState<string>('');
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');

  // Handlers
  const handleCreateFriendGroupBtnClick = () => {
    Popup.openCreateFriendGroup();
  };

  const handleFriendGroupIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFriendGroupId(e.target.value);
  };

  const handleFriendNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendNotes(e.target.value);
  };

  const handleAddBtnClick = () => {
    Popup.approveFriendApplication(targetId, friendGroupId || null, friendNotes);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['dialog-content']} ${popupStyles['col']}`}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
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
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('friend-note-name')}</div>
            <input className={popupStyles['input']} type="text" onChange={handleFriendNotesChange} style={{ maxWidth: '60%' }} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleAddBtnClick}>
          {t('add')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApproveFriendPopup.displayName = 'ApproveFriendPopup';

export default ApproveFriendPopup;
