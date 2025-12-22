import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

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
  const handleEditFriend = (targetId: Types.User['userId'], update: Partial<Types.Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('friend-note-name')}</div>
            <input className={popupStyles['input']} type="text" value={friendNote} placeholder={targetName} onChange={(e) => setFriendNote(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={() => handleEditFriend(targetId, { note: friendNote })}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendNotePopup.displayName = 'EditFriendNotePopup';

export default EditFriendNotePopup;
