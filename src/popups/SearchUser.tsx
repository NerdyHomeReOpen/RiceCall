import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

const SearchUserPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  // States
  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Variables
  const canSubmit = query.trim();

  // Functions
  const searchUser = (query: string) => {
    ipc.data.searchUser({ query }).then((users) => {
      const target = users[0];

      if (!target) {
        setError(t('user-not-found'));
        return;
      }

      ipc.data.friend({ userId: user.userId, targetId: target.userId }).then((friend) => {
        if (friend && friend.relationStatus === 2) setError(t('user-is-friend'));
        else if (target.userId === user.userId) setError(t('cannot-add-yourself'));
        else Popup.openApplyFriend(user.userId, target.userId);
      });
    });
  };

  // Handlers
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    searchUser(query);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    setError(null);
  }, [query]);

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`} style={{ position: 'relative' }}>
            <div className={popupStyles['label']}>{t('please-input-user-account')}</div>
            <input name="search-query" type="text" value={query} onChange={handleQueryChange} required />
            {error && (
              <div style={{ position: 'absolute', top: '2rem', right: '0' }} className={`${popupStyles['label']} ${popupStyles['error-message']}`}>
                {`(${t(error)})`}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
