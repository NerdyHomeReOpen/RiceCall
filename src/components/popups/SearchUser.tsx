import React, { useCallback, useEffect, useState } from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

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
    ipc.socket.send('searchUser', { query });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleUserSearch = useCallback(
    (...args: User[]) => {
      // TODO: Need to handle while already friend
      if (!args.length) {
        setIsNotFound(true);
        return;
      }
      const { userId: targetId } = args[0];
      handleOpenApplyFriend(userId, targetId);
      handleClose();
    },
    [userId],
  );

  // Effects
  useEffect(() => {
    setIsNotFound(false);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = [ipc.socket.on('userSearch', handleUserSearch)];
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
