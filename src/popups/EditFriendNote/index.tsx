import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

interface EditFriendNotePopupProps {
  id: string;
  friend: Types.Friend;
}

const EditFriendNotePopup: React.FC<EditFriendNotePopupProps> = React.memo(({ id, friend }) => {
  const { t } = useTranslation();

  const [friendNote, setFriendNote] = useState<string>(friend.note);

  const handleFriendNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendNote(e.target.value);
  };

  const handleSaveBtnClick = () => {
    Actions.editFriend(friend.targetId, { note: friendNote });
    handleCloseBtnClick();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="input-box col">
            <div className="label">{t('friend-note-name')}</div>
            <input className="input" type="text" value={friendNote} placeholder={friend.name} onChange={handleFriendNoteChange} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleSaveBtnClick}>
          {t('save')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendNotePopup.displayName = 'EditFriendNotePopup';

export default EditFriendNotePopup;
