/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, DirectMessage, SocketServerEvent, Server } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Components
import MessageViewer from '@/components/MessageViewer';
import BadgeListViewer from '@/components/BadgeList';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

// CSS
import directMessage from '@/styles/popups/directMessage.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import grade from '@/styles/grade.module.css';

interface DirectMessagePopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  windowRef: React.RefObject<HTMLDivElement>;
}

const SHAKE_COOLDOWN = 3000;

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(
  ({ userId, targetId, windowRef }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);
    const cooldownRef = useRef(0);

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [target, setTarget] = useState<User>(createDefault.user());
    const [targetCurrentServer, setTargetCurrentServer] = useState<Server>(
      createDefault.server(),
    );
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [isFriend, setIsFriend] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(false);

    // Variables
    const { avatarUrl: userAvatarUrl } = user;
    const {
      avatarUrl: targetAvatarUrl,
      level: targetLevel,
      vip: targetVip,
      currentServerId: targetCurrentServerId,
      badges: targetBadges,
    } = target;
    const { name: targetCurrentServerName } = targetCurrentServer;

    // Handlers
    const handleSendMessage = (
      directMessage: Partial<DirectMessage>,
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.directMessage({ directMessage, userId, targetId });
    };

    const handleSendShakeWindow = () => {
      if (!socket || cooldownRef.current > 0) return;
      socket.send.shakeWindow({ userId, targetId });
      cooldownRef.current = SHAKE_COOLDOWN;

      // debounce
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SHAKE_COOLDOWN - elapsed);

        if (remaining === 0) {
          clearInterval(timer);
        }

        cooldownRef.current = remaining;
      }, 100);

      return () => clearInterval(timer);
    };

    const handleOnDirectMessage = (data: DirectMessage) => {
      if (!data) return;
      // !! THIS IS IMPORTANT !!
      const user1Id = userId.localeCompare(targetId) < 0 ? userId : targetId;
      const user2Id = userId.localeCompare(targetId) < 0 ? targetId : userId;

      // check if the message array is between the current users
      const isCurrentMessage =
        data.user1Id === user1Id && data.user2Id === user2Id;

      if (isCurrentMessage) setDirectMessages((prev) => [...prev, data]);
    };

    const handleShakeWindow = (duration = 500) => {
      if (!windowRef.current) return;

      const start = performance.now();

      const shake = (time: number) => {
        const elapsed = time - start;
        if (elapsed > duration) {
          windowRef.current.style.transform = 'translate(0, 0)';
          return;
        }

        const x = Math.round((Math.random() - 0.5) * 10);
        const y = Math.round((Math.random() - 0.5) * 10);
        windowRef.current.style.transform = `translate(${x}px, ${y}px)`;

        requestAnimationFrame(shake);
      };
      requestAnimationFrame(shake);
    };

    const handleServerSelect = (userId: User['userId'], server: Server) => {
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: server.displayId,
          timestamp: Date.now(),
        }),
      );
      setTimeout(() => {
        socket.send.connectServer({ userId, serverId: server.serverId });
      }, 1500);
    };

    // Effects
    useEffect(() => {
      const offShakeWindow = ipcService.window.onShakeWindow(() =>
        handleShakeWindow(),
      );

      return () => offShakeWindow();
    }, []);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.ON_DIRECT_MESSAGE]: handleOnDirectMessage,
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
          refreshService.user({
            userId: targetId,
          }),
          refreshService.user({
            userId: userId,
          }),
          refreshService.friend({
            userId: userId,
            targetId: targetId,
          }),
        ]).then(([target, user, friend]) => {
          if (target) {
            setTarget(target);
          }
          if (user) {
            setUser(user);
          }
          if (friend) {
            if (friend.online) {
              setIsOnline(friend.online);
            }
            setIsFriend(true);
          }
        });
      };
      refresh();
    }, [userId, targetId]);

    useEffect(() => {
      setIsOnline(targetCurrentServerId ? true : false); // 後端更新後移除
      if (!targetCurrentServerId) return;
      Promise.all([
        refreshService.server({
          serverId: targetCurrentServerId,
        }),
      ]).then(([server]) => {
        if (server) setTargetCurrentServer(server);
      });
    }, [targetCurrentServerId]);

    return (
      <div className={popup['popupContainer']}>
        {/* Body */}
        <div className={popup['popupBody']}>
          {/* Sidebar */}
          <div className={directMessage['sidebar']}>
            <div className={directMessage['targetBox']}>
              <div
                className={`${directMessage['avatarPicture']} ${
                  isFriend && isOnline ? '' : directMessage['offline']
                }`}
                style={{ backgroundImage: `url(${targetAvatarUrl})` }}
              />
              {targetVip > 0 && (
                <div
                  className={`
                  ${vip['vipIconBig']}
                  ${vip[`vip-big-${targetVip}`]}`}
                />
              )}
              <div className={directMessage['userStateBox']}>
                <div
                  title={`${lang.tr.level}: ${targetLevel}`}
                  className={`
                    ${grade['grade']}
                    ${grade[`lv-${Math.min(56, targetLevel)}`]}
                  `}
                />
                {targetBadges.length > 0 ? (
                  <div className={directMessage['userFriendSplit']} />
                ) : (
                  ''
                )}
                <BadgeListViewer badges={targetBadges} maxDisplay={13} />
              </div>
            </div>
            <div className={directMessage['userBox']}>
              <div
                className={directMessage['avatarPicture']}
                style={{ backgroundImage: `url(${userAvatarUrl})` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className={directMessage['mainContent']}>
            {isFriend && isOnline && targetCurrentServerId && (
              <div
                className={directMessage['serverInArea']}
                onClick={() => {
                  handleServerSelect(userId, targetCurrentServer);
                }}
              >
                <div className={directMessage['serverInIcon']} />
                <div className={directMessage['serverInName']}>
                  {targetCurrentServerName}
                </div>
              </div>
            )}
            <div className={directMessage['notifyArea']}>
              {
                isFriend
                  ? ''
                  : '對方不在你的好友列表，一些功能將無法使用!' /* TODO: lang.tr */
              }
            </div>
            <div className={directMessage['messageArea']}>
              <MessageViewer messages={directMessages} />
            </div>
            <div className={directMessage['inputArea']}>
              <div className={directMessage['topBar']}>
                <div className={directMessage['buttons']}>
                  <div
                    className={`${directMessage['button']} ${directMessage['font']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['emoji']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['screenShot']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['nudge']}`}
                    onClick={() => handleSendShakeWindow()}
                  />
                </div>
                <div className={directMessage['buttons']}>
                  <div className={directMessage['historyMessage']}>
                    {lang.tr.messageHistory}
                  </div>
                </div>
              </div>
              <textarea
                className={directMessage['input']}
                value={messageInput}
                onChange={(e) => {
                  e.preventDefault();
                  setMessageInput(e.target.value);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  setMessageInput(
                    (prev) => prev + e.clipboardData.getData('text'),
                  );
                }}
                onKeyDown={(e) => {
                  if (e.shiftKey) return;
                  if (e.key !== 'Enter') return;
                  else e.preventDefault();
                  if (!messageInput.trim()) return;
                  if (messageInput.length > 2000) return;
                  if (isComposing) return;
                  handleSendMessage(
                    { type: 'dm', content: messageInput },
                    userId,
                    targetId,
                  );
                  setMessageInput('');
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                maxLength={2000}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

DirectMessagePopup.displayName = 'DirectMessagePopup';

export default DirectMessagePopup;
