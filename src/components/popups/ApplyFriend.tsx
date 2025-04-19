import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import applyFriend from '@/styles/popups/apply.module.css';

// Types
import {
  Friend,
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
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ApplyFriendPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(
  (initialData: ApplyFriendPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // State
    const [section, setSection] = useState<number>(0);
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>([]);
    const [targetName, setTargetName] = useState<User['name']>(
      createDefault.user().name,
    );
    const [targetAvatarUrl, setTargetAvatarUrl] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [applicationSenderId, setApplicationSenderId] =
      useState<User['userId']>('');
    const [applicationReceiverId, setApplicationReceiverId] =
      useState<User['userId']>('');
    const [applicationDescription, setApplicationDescription] = useState<
      FriendApplication['description']
    >(createDefault.friendApplication().description);
    const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<
      FriendGroup['friendGroupId'] | null
    >(null);

    // Variables
    const { userId, targetId } = initialData;

    // Handlers
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

    const handleDeleteFriendApplication = (
      senderId: User['userId'],
      receiverId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.deleteFriendApplication({ senderId, receiverId });
    };

    const handleCreateFriend = (
      friend: Partial<Friend>,
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.createFriend({ friend, userId, targetId });
    };

    const handleUserFriendGroupsUpdate = (data: FriendGroup[] | null) => {
      if (!data) data = [];
      setUserFriendGroups(data);
    };

    const handleTargetUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setTargetName(data.name);
      setTargetAvatarUrl(data.avatarUrl);
    };

    const handleSentApplicationUpdate = (data: FriendApplication | null) => {
      if (data) setSection(1);
      if (!data) return;
      setApplicationDescription(data.description);
      setApplicationSenderId(data.senderId);
      setApplicationReceiverId(data.receiverId);
    };

    const handleReceivedApplicationUpdate = (
      data: FriendApplication | null,
    ) => {
      if (data) setSection(2);
      if (!data) return;
      setApplicationDescription(data.description);
      setApplicationSenderId(data.senderId);
      setApplicationReceiverId(data.receiverId);
    };

    const handleOpenSuccessDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(PopupType.DIALOG_SUCCESS, {
        title: message,
        submitTo: PopupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_SUCCESS, () => {
        handleClose();
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_FRIEND_GROUPS_UPDATE]:
          handleUserFriendGroupsUpdate,
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
          refreshService.userFriendGroups({
            userId: userId,
          }),
          refreshService.user({
            userId: targetId,
          }),
          refreshService.friendApplication({
            senderId: userId,
            receiverId: targetId,
          }),
          refreshService.friendApplication({
            senderId: targetId,
            receiverId: userId,
          }),
        ]).then(
          ([
            userFriendGroups,
            target,
            sentApplication,
            receivedApplication,
          ]) => {
            handleUserFriendGroupsUpdate(userFriendGroups);
            handleTargetUpdate(target);
            handleSentApplicationUpdate(sentApplication);
            handleReceivedApplicationUpdate(receivedApplication);
          },
        );
      };
      refresh();
    }, [userId, targetId, socket]);

    switch (section) {
      // Friend Application Form
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['infoWrapper']}>
                      <div className={applyFriend['mainText']}>
                        {targetName}
                      </div>
                      <div className={applyFriend['subText']}>{targetName}</div>
                    </div>
                  </div>
                  <div className={applyFriend['split']} />
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{lang.tr.friendNote}</div>
                    <textarea
                      rows={2}
                      value={applicationDescription}
                      onChange={(e) =>
                        setApplicationDescription(e.target.value)
                      }
                    />
                    <div className={popup['hint']}>{lang.tr.max120content}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button
                className={popup['button']}
                onClick={() => {
                  handleCreateFriendApplication(
                    { description: applicationDescription },
                    userId,
                    targetId,
                  );
                  handleOpenSuccessDialog(lang.tr.friendApply);
                }}
              >
                {lang.tr.sendRequest}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Show Notification
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['infoWrapper']}>
                      <div className={applyFriend['mainText']}>
                        {targetName}
                      </div>
                      <div className={applyFriend['subText']}>{targetName}</div>
                    </div>
                  </div>
                  <div className={applyFriend['split']} />
                  <div className={popup['hint']}>{lang.tr.friendApplySent}</div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                {lang.tr.modify}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.confirm}
              </button>
            </div>
          </div>
        );

      // Apply Friend
      case 2:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['infoWrapper']}>
                      <div className={applyFriend['mainText']}>
                        {targetName}
                      </div>
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
                          {userFriendGroups.map((group) => (
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

            <div className={popup['popupFooter']}>
              <button
                className={popup['button']}
                onClick={() => {
                  handleDeleteFriendApplication(
                    applicationSenderId,
                    applicationReceiverId,
                  );
                  handleCreateFriend(
                    { friendGroupId: selectedFriendGroupId },
                    userId,
                    targetId,
                  );
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
        );
    }
  },
);

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
