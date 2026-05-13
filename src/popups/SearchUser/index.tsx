import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { openApplyFriend } from '@/services';

import { useAppSelector } from '@/hooks/Store';

interface SearchUserPopupProps {
  id: string;
}

const SearchUserPopup: React.FC<SearchUserPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = query.trim();

  const searchUser = (query: string) => {
    ipc.api
      .searchUser({ query })
      .then((users) => {
        const target = users[0];

        if (!target) {
          setError(t('user-not-found'));
          return;
        }

        ipc.api.fetchFriend({ userId: user.userId, targetId: target.userId }).then((friend) => {
          if (friend && friend.relationStatus === 2) setError(t('user-is-friend'));
          else if (target.userId === user.userId) setError(t('cannot-add-yourself'));
          else {
            openApplyFriend(user.userId, target.userId).then(() => {
              ipc.popup.close(id);
            });
          }
        });
      })
      .catch(() => {
        setError(t('user-not-found'));
      });
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    searchUser(query);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  useEffect(() => {
    setError(null);
  }, [query]);

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="input-box col" style={{ position: 'relative' }}>
            <div className="label">{t('please-input-user-account')}</div>
            <input name="search-query" type="text" value={query} onChange={handleQueryChange} required />
            {error && (
              <div style={{ position: 'absolute', top: '2rem', right: '5px' }} className="error-text">
                {`(${t(error)})`}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
