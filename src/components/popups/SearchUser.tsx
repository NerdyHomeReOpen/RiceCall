import React, { useCallback, useEffect, useState } from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface SearchUserPopupProps {
  userId: User['userId'];
}

const SearchUserPopup: React.FC<SearchUserPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Handlers
  const handleSearchUser = (query: string) => {
    ipcService.socket.send('searchUser', { query });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleUserSearch = useCallback(
    (...args: User[]) => {
      // TODO: Need to handle while already friend
      const result = args[0];
      if (!result) {
        setIsNotFound(true);
        return;
      }
      ipcService.popup.open('applyFriend', 'applyFriend', { userId, targetId: result.userId });
      handleClose();
    },
    [userId],
  );

  // Effects
  useEffect(() => {
    setIsNotFound(false);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = [ipcService.socket.on('userSearch', handleUserSearch)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleUserSearch]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`} style={{ position: 'relative' }}>
              <div className={popup['label']}>{t('please-input-friend-account')}</div>
              <input name="search-query" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required />
              {isNotFound && (
                <div style={{ position: 'absolute', top: '2rem', right: '0' }} className={`${popup['label']} ${popup['error-message']}`}>
                  ({t('user-not-found')})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={`${popup['button']} ${!searchQuery.trim() ? 'disabled' : ''}`} onClick={() => handleSearchUser(searchQuery)}>
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
