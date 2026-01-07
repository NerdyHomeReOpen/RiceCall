import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface EditFriendNotePopupProps {
  friend: Types.Friend;
}

const EditFriendNotePopup: React.FC<EditFriendNotePopupProps> = React.memo(({ friend }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendNote, setFriendNote] = useState<string>(friend.note);

  // Variables
  const { targetId, name: targetName } = friend;

  // Handlers
  const handleFriendNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendNote(e.target.value);
  };

  const handleSaveBtnClick = () => {
    Popup.editFriend(targetId, { note: friendNote });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('friend-note-name')}</div>
            <input className={popupStyles['input']} type="text" value={friendNote} placeholder={targetName} onChange={handleFriendNoteChange} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleSaveBtnClick}>
          {t('save')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendNotePopup.displayName = 'EditFriendNotePopup';

export default EditFriendNotePopup;
