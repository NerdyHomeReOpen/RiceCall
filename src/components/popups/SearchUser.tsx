import React, { useCallback, useEffect, useState } from 'react';

// Types
import { PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface SearchUserPopupProps {
  userId: User['userId'];
}

const SearchUserPopup: React.FC<SearchUserPopupProps> = React.memo(
  (initialData: SearchUserPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Variables
    const { userId } = initialData;

    // Handlers
    const handleSearchUser = (searchQuery: string) => {
      if (!socket) return;
      socket.send.searchUser({ query: searchQuery });
    };

    const handleUserSearch = useCallback(
      (user: User | null) => {
        if (!user) return;
        if (user.userId === userId) return;
        ipcService.popup.open(PopupType.APPLY_FRIEND);
        ipcService.initialData.onRequest(
          PopupType.APPLY_FRIEND,
          { userId: userId, targetId: user.userId },
          () => handleClose(),
        );
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
      <form
        className={popup['popupContainer']}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchUser(searchQuery);
        }}
      >
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseInputFriendAccount}
                </div>
                <input
                  className={popup['input']}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            type="submit"
            className={`${popup['button']} ${
              !searchQuery.trim() ? popup['disabled'] : ''
            }`}
            disabled={!searchQuery.trim()}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </form>
    );
  },
);

SearchUserPopup.displayName = 'SearchUserPopup';

export default SearchUserPopup;
