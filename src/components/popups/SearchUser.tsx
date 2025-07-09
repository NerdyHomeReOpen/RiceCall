import React, { useCallback, useEffect, useState } from 'react';

// Types
import { PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface SearchUserPopupProps {
  userId: User['userId'];
}

const SearchUserPopup: React.FC<SearchUserPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handlers
  const handleSearchUser = (searchQuery: string) => {
    if (!socket) return;
    socket.send.searchUser({ query: searchQuery });
  };

  const handleUserSearch = useCallback(
    (result: User | null) => {
      if (!result) return;
      if (result.userId === userId) return;
      ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
      ipcService.initialData.onRequest('applyFriend', { userId: userId, targetId: result.userId }, () => handleClose());
    },
    [userId],
  );

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.USER_SEARCH]: handleUserSearch,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket, handleUserSearch]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={setting['body']}>
          <div className={popup['input-group']}>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-input-friend-account')}</div>
              <input
                name="query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!searchQuery.trim() ? popup['disabled'] : ''}`}
          onClick={() => handleSearchUser(searchQuery)}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
