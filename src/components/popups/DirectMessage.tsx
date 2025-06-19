/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

// Types
import {
  User,
  DirectMessage,
  SocketServerEvent,
  Server,
  PromptMessage,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MessageViewer from '@/components/MessageViewer';
import BadgeListViewer from '@/components/BadgeList';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

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
    const contextMenu = useContextMenu();

    // Refs
    const refreshRef = useRef(false);
    const cooldownRef = useRef(0);
    const emojiIconRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // States
    const [user, setUser] = useState<User>(Default.user());
    const [target, setTarget] = useState<User>(Default.user());
    const [targetCurrentServer, setTargetCurrentServer] = useState<Server>(
      Default.server(),
    );
    const [directMessages, setDirectMessages] = useState<
      (DirectMessage | PromptMessage)[]
    >([]);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [isFriend, setIsFriend] = useState<boolean>(false);

    // Variables
    const { avatarUrl: userAvatarUrl } = user;

    const {
      avatarUrl: targetAvatarUrl,
      level: targetLevel,
      vip: targetVip,
      status: targetStatus,
      currentServerId: targetCurrentServerId,
      badges: targetBadges,
    } = target;
    const isOnline = targetStatus !== 'offline';
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

      if (isFriend) {
        socket.send.shakeWindow({ userId, targetId });
      } else {
        setDirectMessages((prev) => [
          ...prev,
          {
            type: 'warn',
            content:
              "<span style='color: #038792'>你還不是對方的好友，這項功能無法使用!</span>",
            timestamp: Date.now(),
            parameter: {},
            contentMetadata: {},
          },
        ]);
      }

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

    const handleDirectMessage = (data: DirectMessage) => {
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

    const handleServerSelect = (
      serverId: Server['serverId'],
      serverDisplayId: Server['displayId'],
    ) => {
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }),
      );
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
        [SocketServerEvent.DIRECT_MESSAGE]: handleDirectMessage,
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
          getService.user({
            userId: userId,
          }),
          getService.friend({
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
            setIsFriend(true);
          }
        });
      };
      refresh();
    }, [userId, targetId]);

    useEffect(() => {
      if (!targetCurrentServerId) return;
      Promise.all([
        getService.server({
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
                className={`${directMessage['actionArea']} ${directMessage['clickable']}`}
                onClick={() => {
                  handleServerSelect(
                    targetCurrentServer.serverId,
                    targetCurrentServer.displayId,
                  );
                }}
              >
                <div
                  className={`${directMessage['actionIcon']} ${directMessage['inServer']}`}
                />
                <div className={directMessage['actionTitle']}>
                  {targetCurrentServerName}
                </div>
              </div>
            )}
            {!isFriend && (
              <div className={directMessage['actionArea']}>
                <div className={directMessage['actionTitle']}>
                  {'對方不在你的好友列表，一些功能將無法使用!'}
                </div>
              </div>
            )}
            <div className={directMessage['messageArea']}>
              <MessageViewer messages={directMessages} userId={userId} />
            </div>
            <div className={directMessage['inputArea']}>
              <div className={directMessage['topBar']}>
                <div className={directMessage['buttons']}>
                  <div
                    className={`${directMessage['button']} ${directMessage['font']}`}
                  />
                  <div
                    ref={emojiIconRef}
                    className={`${directMessage['button']} ${directMessage['emoji']}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!emojiIconRef.current) return;
                      const x = emojiIconRef.current.getBoundingClientRect().x;
                      const y = emojiIconRef.current.getBoundingClientRect().y;
                      contextMenu.showEmojiPicker(
                        x,
                        y,
                        true,
                        'unicode',
                        (emoji) => {
                          setMessageInput((prev) => prev + emoji);
                          if (textareaRef.current) textareaRef.current.focus();
                        },
                      );
                    }}
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
                ref={textareaRef}
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
