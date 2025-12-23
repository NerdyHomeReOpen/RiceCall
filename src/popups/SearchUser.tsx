import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface SearchUserPopupProps {
  userId: Types.User['userId'];
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
    ipc.data.searchUser({ query }).then((users) => {
      if (!users.length) {
        setError(t('user-not-found'));
        return;
      }

      const { userId: targetId } = users[0];

      ipc.data.friend({ userId, targetId }).then((friend) => {
        if (friend && friend.relationStatus === 2) setError(t('user-is-friend'));
        else if (targetId === userId) setError(t('cannot-add-yourself'));
        else Popup.handleOpenApplyFriend(userId, targetId);
      });
    });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    setError(null);
  }, [searchQuery]);

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={{ position: 'relative' }}>
            <div className={popupStyles['label']}>{t('please-input-user-account')}</div>
            <input name="search-query" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required />
            {error && (
              <div style={{ position: 'absolute', top: '2rem', right: '0' }} className={`${popupStyles['label']} ${popupStyles['error-message']}`}>
                {`(${t(error)})`}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleSearchUser(searchQuery) : null)}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
