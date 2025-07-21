import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import { FriendApplication, FriendGroup, PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface ApplyFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ userId, targetId }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();

  // Refs
  const refreshRef = useRef(false);

  // State
  const [section, setSection] = useState<number>(0);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [target, setTarget] = useState<User>(Default.user());
  const [friendApplication, setFriendApplication] = useState<FriendApplication>(Default.friendApplication());
  const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<FriendGroup['friendGroupId'] | null>(null);

  // Variables
  const { name: targetName, avatarUrl: targetAvatarUrl } = target;
  const { description: applicationDesc } = friendApplication;

  // Handlers
  const handleFriendGroupAdd = (data: FriendGroup) => {
    setFriendGroups((prev) => [...prev, data]);
  };

  const handleFriendGroupUpdate = (id: FriendGroup['friendGroupId'], data: Partial<FriendGroup>) => {
    setFriendGroups((prev) => prev.map((item) => (item.friendGroupId === id ? { ...item, ...data } : item)));
  };

  const handleFriendGroupRemove = (id: FriendGroup['friendGroupId']) => {
    setFriendGroups((prev) => prev.filter((item) => item.friendGroupId !== id));
  };

  const handleCreateFriendApplication = (friendApplication: Partial<FriendApplication>, senderId: User['userId'], receiverId: User['userId']) => {
    if (!socket) return;
    socket.send.createFriendApplication({
      friendApplication,
      senderId,
      receiverId,
    });
  };

  const handleApproveFriendApplication = (senderId: User['userId'], receiverId: User['userId']) => {
    if (!socket) return;
    socket.send.approveFriendApplication({
      senderId,
      receiverId,
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, {
      userId,
      targetId,
    });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.FRIEND_GROUP_ADD]: handleFriendGroupAdd,
      [SocketServerEvent.FRIEND_GROUP_UPDATE]: handleFriendGroupUpdate,
      [SocketServerEvent.FRIEND_GROUP_REMOVE]: handleFriendGroupRemove,
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
    if (!userId || !targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: targetId }).then((target) => {
        if (target) setTarget(target);
      });
      getService.userFriendGroups({ userId: userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      getService.friendApplication({ senderId: userId, receiverId: targetId }).then((sentFriendApplication) => {
        if (sentFriendApplication) {
          setSection(1);
          setFriendApplication(sentFriendApplication);
        }
      });
      getService.friendApplication({ senderId: targetId, receiverId: userId }).then((receivedFriendApplication) => {
        if (receivedFriendApplication) {
          setSection(2);
          setFriendApplication(receivedFriendApplication);
        }
      });
    };
    refresh();
  }, [userId, targetId, socket]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['label']}>{t('friend-label')}</div>
          <div className={popup['row']} onClick={() => handleOpenUserInfo(userId, targetId)}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['bold-text']}>{targetName}</div>
              <div className={popup['sub-text']}>{targetName}</div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('friend-note')}</div>
            <textarea
              rows={2}
              value={applicationDesc}
              onChange={(e) =>
                setFriendApplication((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('friend-apply-sent')}
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('friend-select-group')}</div>
            <div className={popup['row']}>
              <div className={popup['select-box']}>
                <select className={popup['select']} value={selectedFriendGroupId || ''} onChange={(e) => setSelectedFriendGroupId(e.target.value)}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={popup['link-text']}>{t('friend-add-group')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleCreateFriendApplication({ description: applicationDesc }, userId, targetId);
            handleClose();
          }}
        >
          {t('send-request')}
        </div>
        <div className={popup['button']} style={section === 0 ? {} : { display: 'none' }} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => setSection(0)}>
          {t('modify')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => handleClose()}>
          {t('confirm')}
        </div>
        <div
          className={popup['button']}
          style={section === 2 ? {} : { display: 'none' }}
          onClick={() => {
            handleApproveFriendApplication(targetId, userId);
            handleClose();
          }}
        >
          {t('add')}
        </div>
        <div className={popup['button']} style={section === 2 ? {} : { display: 'none' }} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
