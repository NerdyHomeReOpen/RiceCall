import React, { useState } from 'react';

// Types
import type { User, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

interface EditFriendNotePopupProps {
  friend: Friend;
}

const EditFriendNotePopup: React.FC<EditFriendNotePopupProps> = React.memo(({ friend }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [friendNote, setFriendNote] = useState<string>(friend.note);

  // Variables
  const { targetId, name: targetName } = friend;

  // Handlers
  const handleEditFriend = (targetId: User['userId'], update: Partial<Friend>) => {
    ipc.socket.send('editFriend', { targetId, update });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('friend-note-name')}</div>
            <input className={popup['input']} type="text" value={friendNote} placeholder={targetName} onChange={(e) => setFriendNote(e.target.value)} />
          </div>
        </div>
      </div>
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleEditFriend(targetId, { note: friendNote })}>
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
