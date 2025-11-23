import React, { useEffect, useState } from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenApplyFriend } from '@/utils/popup';

interface SearchUserPopupProps {
  userId: User['userId'];
}

const SearchUserPopup: React.FC<SearchUserPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Variables
  const canSubmit = searchQuery.trim();

  // Handlers
  const handleSearchUser = (query: string) => {
    ipc.socket.send('searchUser', { query });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    setError(null);
  }, [searchQuery]);

  useEffect(() => {
    const unsub = ipc.socket.on('userSearch', (...args: User[]) => {
      // TODO: Need to handle while already friend
      if (!args.length) {
        setError(t('user-not-found'));
        return;
      }
      const { userId: targetId } = args[0];
      ipc.data.friend(userId, targetId).then((friend) => {
        if (friend && friend.relationStatus === 2) setError(t('user-is-friend'));
        else if (targetId === userId) setError(t('cannot-add-yourself'));
        else handleOpenApplyFriend(userId, targetId);
        ipc.window.close();
      });
    });
    return () => unsub();
  }, [userId, t]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['input-box']} ${popup['col']}`} style={{ position: 'relative' }}>
            <div className={popup['label']}>{t('please-input-user-account')}</div>
            <input name="search-query" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required />
            {error && (
              <div style={{ position: 'absolute', top: '2rem', right: '0' }} className={`${popup['label']} ${popup['error-message']}`}>
                {`(${t(error)})`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleSearchUser(searchQuery) : null)}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
