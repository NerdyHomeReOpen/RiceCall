import React, { useState } from 'react';

// Types
import type { User, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface EditFriendNotePopupProps {
  friend: Friend;
}

const EditFriendNotePopup: React.FC<EditFriendNotePopupProps> = React.memo(({ friend: friendData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendNote, setFriendNote] = useState<string>(friendData.note);

  // Variables
  const { targetId, name: targetName } = friendData;

  // Handlers
  const handleEditFriend = (targetId: User['userId'], update: Partial<Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('friend-note-name')}</div>
              <input className={popup['input']} type="text" value={friendNote} placeholder={targetName} onChange={(e) => setFriendNote(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditFriend(targetId, { note: friendNote });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditFriendNotePopup.displayName = 'EditFriendNotePopup';

export default EditFriendNotePopup;
