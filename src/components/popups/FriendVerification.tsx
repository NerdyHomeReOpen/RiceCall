import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, UserFriend, FriendApplication, PopupType, SocketServerEvent } from '@/types';

// CSS
import popup from '@/styles/popup.module.css';
import friendVerification from '@/styles/popups/friendVerification.module.css';

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
    <div className={popup['popupContainer']} tabIndex={0}>
      <div className={popup['popupBody']}>
        <div className={`${friendVerification['body']}`}>
          <div className={friendVerification['contentHeader']}>
            <div className={friendVerification['ProcessingStatus']}>
              {t('unprocessed')}
              <span className={friendVerification['ProcessingStatusCount']}>({friendApplications.length})</span>
            </div>
            <div
              className={friendVerification['allCancel']}
              onClick={() => {
                if (friendApplications.length === 0) return;
                handleDeleteAllFriendApplication();
              }}
            >
              {t('reject-all')}
            </div>
          </div>
          <div className={friendVerification['contentBody']}>
            {friendApplications.map((friend) => {
              return (
                <div key={friend.senderId} className={friendVerification['userInfoBox']}>
                  <div
                    className={friendVerification['avatarBox']}
                    style={{ backgroundImage: `url(${friend.avatarUrl})` }}
                  />
                  <div className={friendVerification['userApplyContentBox']}>
                    <div className={friendVerification['userInfo']}>
                      <div className={friendVerification['userName']}>{friend.name}</div>
                      <div className={friendVerification['time']} title={getFormatTimestamp(t, friend.createdAt)}>
                        {getFormatTimeDiff(t, friend.createdAt)}
                      </div>
                    </div>
                    <div className={friendVerification['userApplyContent']}>
                      <div className={friendVerification['userApplyContentText']}>
                        <div className={friendVerification['userApplyContentRow']}>
                          {t('request-to-add-you-as-a-friend')}
                        </div>
                        <div className={friendVerification['userApplyContentRow']}>
                          {t('description')}: {friend.description}
                        </div>
                      </div>
                      <div className={friendVerification['userApplyContentButtonBox']}>
                        <div className={friendVerification['userApplyContentActionButtons']}>
                          <button
                            className={friendVerification['userApplyContentButton']}
                            onClick={() => {
                              handleOpenApplyFriend(userId, friend.senderId);
                            }}
                          >
                            {t('accept')}
                          </button>
                          <button
                            className={friendVerification['userApplyContentButton']}
                            onClick={() => {
                              handleDeleteFriendApplication(friend.senderId, friend.receiverId);
                            }}
                          >
                            {t('reject')}
                          </button>
                        </div>
                        <div
                          className={friendVerification['directMessageButton']}
                          onClick={() => {
                            handleOpenDirectMessage(friend.receiverId, friend.senderId, friend.name);
                          }}
                        >
                          <div className={friendVerification['directMessageButtonIcon']}></div>
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
    </div>
  );
});

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;
