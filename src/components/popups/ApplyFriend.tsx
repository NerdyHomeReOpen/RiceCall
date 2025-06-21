import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import applyFriend from '@/styles/popups/apply.module.css';

// Types
import {
  FriendApplication,
  FriendGroup,
  PopupType,
  SocketServerEvent,
  User,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface ApplyFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(
  ({ userId, targetId }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // State
    const [section, setSection] = useState<number>(0);
    const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
    const [target, setTarget] = useState<User>(Default.user());
    const [friendApplication, setFriendApplication] =
      useState<FriendApplication>(Default.friendApplication());
    const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<
      FriendGroup['friendGroupId'] | null
    >(null);

    // Variables
    const { name: targetName, avatarUrl: targetAvatarUrl } = target;
    const { description: applicationDesc } = friendApplication;

    // Handlers
    const handleFriendGroupAdd = (data: FriendGroup) => {
      setFriendGroups((prev) => [...prev, data]);
    };

    const handleFriendGroupUpdate = (
      id: FriendGroup['friendGroupId'],
      data: Partial<FriendGroup>,
    ) => {
      setFriendGroups((prev) =>
        prev.map((item) =>
          item.friendGroupId === id ? { ...item, ...data } : item,
        ),
      );
    };

    const handleFriendGroupRemove = (id: FriendGroup['friendGroupId']) => {
      setFriendGroups((prev) =>
        prev.filter((item) => item.friendGroupId !== id),
      );
    };

    const handleCreateFriendApplication = (
      friendApplication: Partial<FriendApplication>,
      senderId: User['userId'],
      receiverId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.createFriendApplication({
        friendApplication,
        senderId,
        receiverId,
      });
    };

    const handleApproveFriendApplication = (
      senderId: User['userId'],
      receiverId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.approveFriendApplication({
        senderId,
        receiverId,
      });
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
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
        Promise.all([
          getService.user({
            userId: targetId,
          }),
          getService.userFriendGroups({
            userId: userId,
          }),
          getService.friendApplication({
            senderId: userId,
            receiverId: targetId,
          }),
          getService.friendApplication({
            senderId: targetId,
            receiverId: userId,
          }),
        ]).then(
          ([
            target,
            friendGroups,
            sentFriendApplication,
            receivedFriendApplication,
          ]) => {
            if (target) {
              setTarget(target);
            }
            if (friendGroups) {
              setFriendGroups(friendGroups);
            }
            if (sentFriendApplication) {
              setSection(1);
              setFriendApplication(sentFriendApplication);
            }
            if (receivedFriendApplication) {
              setSection(2);
              setFriendApplication(receivedFriendApplication);
            }
          },
        );
      };
      refresh();
    }, [userId, targetId, socket]);

    return (
      <>
        {/* Apply Friend */}
        <div
          className={popup['popupContainer']}
          style={section === 0 ? {} : { display: 'none' }}
        >
          {/* Body */}
          <div className={popup['popupBody']}>
            <div className={setting['body']}>
              <div className={popup['col']}>
                <div className={popup['label']}>{lang.tr.friendLabel}</div>
                <div
                  className={popup['row']}
                  onClick={() => {
                    handleOpenUserInfo(userId, targetId);
                  }}
                >
                  <div className={applyFriend['avatarWrapper']}>
                    <div
                      className={applyFriend['avatarPicture']}
                      style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                    />
                  </div>
                  <div className={applyFriend['infoWrapper']}>
                    <div className={applyFriend['mainText']}>{targetName}</div>
                    <div className={applyFriend['subText']}>{targetName}</div>
                  </div>
                </div>
                <div className={applyFriend['split']} />
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{lang.tr.friendNote}</div>
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
                  <div className={popup['hint']}>{lang.tr.max120content}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={popup['popupFooter']}>
            <button
              className={popup['button']}
              onClick={() => {
                handleCreateFriendApplication(
                  { description: applicationDesc },
                  userId,
                  targetId,
                );
                handleClose();
              }}
            >
              {lang.tr.sendRequest}
            </button>
            <button className={popup['button']} onClick={() => handleClose()}>
              {lang.tr.cancel}
            </button>
          </div>
        </div>

        {/* Sent Friend Application */}
        <div
          className={popup['popupContainer']}
          style={section === 1 ? {} : { display: 'none' }}
        >
          {/* Body */}
          <div className={popup['popupBody']}>
            <div className={setting['body']}>
              <div className={popup['col']}>
                <div className={popup['label']}>{lang.tr.friendLabel}</div>
                <div
                  className={popup['row']}
                  onClick={() => {
                    handleOpenUserInfo(userId, targetId);
                  }}
                >
                  <div className={applyFriend['avatarWrapper']}>
                    <div
                      className={applyFriend['avatarPicture']}
                      style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                    />
                  </div>
                  <div className={applyFriend['infoWrapper']}>
                    <div className={applyFriend['mainText']}>{targetName}</div>
                    <div className={applyFriend['subText']}>{targetName}</div>
                  </div>
                </div>
                <div className={applyFriend['split']} />
                <div className={popup['hint']}>{lang.tr.friendApplySent}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={popup['popupFooter']}>
            <button className={popup['button']} onClick={() => setSection(0)}>
              {lang.tr.modify}
            </button>
            <button className={popup['button']} onClick={() => handleClose()}>
              {lang.tr.confirm}
            </button>
          </div>
        </div>

        {/* Received Friend Application */}
        <div
          className={popup['popupContainer']}
          style={section === 2 ? {} : { display: 'none' }}
        >
          {/* Body */}
          <div className={popup['popupBody']}>
            <div className={setting['body']}>
              <div className={popup['col']}>
                <div className={popup['label']}>{lang.tr.friendLabel}</div>
                <div
                  className={popup['row']}
                  onClick={() => {
                    handleOpenUserInfo(userId, targetId);
                  }}
                >
                  <div className={applyFriend['avatarWrapper']}>
                    <div
                      className={applyFriend['avatarPicture']}
                      style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                    />
                  </div>
                  <div className={applyFriend['infoWrapper']}>
                    <div className={applyFriend['mainText']}>{targetName}</div>
                    <div className={applyFriend['subText']}>{targetName}</div>
                  </div>
                </div>
                <div className={applyFriend['split']} />
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>
                    {lang.tr.friendSelectGroup}
                  </div>
                  <div className={popup['row']}>
                    <div className={popup['selectBox']}>
                      <select
                        className={popup['select']}
                        value={selectedFriendGroupId || ''}
                        onChange={(e) =>
                          setSelectedFriendGroupId(e.target.value)
                        }
                      >
                        <option value={''}>{lang.tr.none}</option>
                        {friendGroups.map((group) => (
                          <option
                            key={group.friendGroupId}
                            value={group.friendGroupId}
                          >
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['link']}>
                      {lang.tr.friendAddGroup}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={popup['popupFooter']}>
            <button
              className={popup['button']}
              onClick={() => {
                handleApproveFriendApplication(targetId, userId);
                handleClose();
              }}
            >
              {lang.tr.add}
            </button>
            <button className={popup['button']} onClick={() => handleClose()}>
              {lang.tr.cancel}
            </button>
          </div>
        </div>
      </>
    );
  },
);

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
