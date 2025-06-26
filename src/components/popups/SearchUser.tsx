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
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={popup['inputGroup']}>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <div className={popup['label']}>{t('pleaseInputFriendAccount')}</div>
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
      <div className={popup['popupFooter']}>
        <button
          type="submit"
          className={popup['button']}
          disabled={!searchQuery.trim()}
          onClick={() => handleSearchUser(searchQuery)}
        >
          {t('confirm')}
        </button>
        <button className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
});

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
