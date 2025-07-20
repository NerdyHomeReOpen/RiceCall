import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, UserFriend, FriendApplication, PopupType, SocketServerEvent } from '@/types';

// CSS
import styles from '@/styles/popups/friendVerification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// Utils
import Sorter from '@/utils/sorter';
import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

interface FriendVerificationPopupProps {
  userId: User['userId'];
}

const FriendVerificationPopup: React.FC<FriendVerificationPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();

  // Refs
  const refreshRef = useRef(false);
  const containerRef = useRef<HTMLFormElement>(null);

  // State
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);

  // Handlers
  const handleSort = <T extends UserFriend | FriendApplication>(field: keyof T, array: T[], direction: 1 | -1) => {
    const newDirection = direction === 1 ? -1 : 1;
    return [...array].sort(Sorter(field, newDirection));
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, {
      userId,
      targetId,
      targetName,
    });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
    ipcService.initialData.onRequest('applyFriend', {
      userId,
      targetId,
    });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', {
      message: message,
      submitTo: 'alertDialog',
    });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleDeleteAllFriendApplication = () => {
    if (!socket) return;

    if (friendApplications.length === 0) return;

    handleOpenAlertDialog(t('confirm-reject-all-friend-application'), () => {
      for (const item of friendApplications) {
        const senderId = item.senderId;
        const receiverId = item.receiverId;
        socket.send.deleteFriendApplication({ senderId, receiverId });
      }
      setFriendApplications([]);
    });
  };

  const handleDeleteFriendApplication = (senderId: User['userId'], receiverId: User['userId']) => {
    setFriendApplications((prev) => {
      return prev.filter((friend) => friend.senderId !== senderId);
    });
    socket.send.deleteFriendApplication({ senderId, receiverId });
  };

  const handleFriendApplicationAdd = (friendApplication: FriendApplication): void => {
    setFriendApplications((prev) => [...prev, friendApplication]);
  };

  const handleFriendApplicationUpdate = (
    senderId: User['userId'],
    receiverId: User['userId'],
    friendApplication: Partial<FriendApplication>,
  ) => {
    setFriendApplications((prev) =>
      prev.map((item) => (item.senderId === senderId ? { ...item, ...friendApplication } : item)),
    );
  };

  const handleFriendApplicationRemove = (senderId: User['userId']) => {
    setFriendApplications((prev) => prev.filter((item) => item.senderId !== senderId));
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.FRIEND_APPLICATION_ADD]: handleFriendApplicationAdd,
      [SocketServerEvent.FRIEND_APPLICATION_UPDATE]: handleFriendApplicationUpdate,
      [SocketServerEvent.FRIEND_APPLICATION_REMOVE]: handleFriendApplicationRemove,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  useEffect(() => {
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.userFriendApplications({
          userId: userId,
        }),
      ]).then(([userFriendApplications]) => {
        if (userFriendApplications) {
          const sortedApplications = handleSort('createdAt', userFriendApplications, 1);
          setFriendApplications(sortedApplications);
        }
      });
    };
    refresh();
  }, [userId]);

  // Effects
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      <div className={popup['popup-body']} style={{ flexDirection: 'column' }}>
        {/* Content Header */}
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({friendApplications.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={() => handleDeleteAllFriendApplication()}>
            {t('reject-all')}
          </div>
        </div>

        {/* Content Body */}
        <div className={styles['content']}>
          {friendApplications.map((friend) => {
            return (
              <div key={friend.senderId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${friend.avatarUrl})` }} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>{friend.name}</div>
                    <div className={styles['time-text']} title={getFormatTimestamp(t, friend.createdAt)}>
                      {getFormatTimeDiff(t, friend.createdAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popup['col']}>
                      <div className={styles['content-text']}>{t('request-to-add-you-as-a-friend')}</div>
                      <div className={styles['content-text']}>
                        {t('description')}: {friend.description}
                      </div>
                    </div>
                    <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div
                          className={styles['button']}
                          onClick={() => handleOpenApplyFriend(userId, friend.senderId)}
                        >
                          {t('accept')}
                        </div>
                        <div
                          className={styles['button']}
                          onClick={() => handleDeleteFriendApplication(friend.senderId, friend.receiverId)}
                        >
                          {t('reject')}
                        </div>
                      </div>
                      <div
                        className={styles['direct-message-button']}
                        onClick={() => handleOpenDirectMessage(friend.receiverId, friend.senderId, friend.name)}
                      >
                        <div className={styles['direct-message-icon']}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;
