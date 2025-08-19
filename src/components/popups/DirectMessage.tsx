import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Types
import { User, DirectMessage, Server, PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MessageViewer from '@/components/MessageViewer';
import BadgeList from '@/components/BadgeList';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

// CSS
import styles from '@/styles/popups/directMessage.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import grade from '@/styles/grade.module.css';

interface DirectMessagePopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  event: 'directMessage' | 'shakeWindow';
  message: DirectMessage;
}

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(({ userId, targetId, event, message }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const isComposingRef = useRef<boolean>(false);
  const cooldownRef = useRef<number>(0);
  const refreshRef = useRef(false);
  const emojiIconRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [target, setTarget] = useState<User>(Default.user());
  const [targetCurrentServer, setTargetCurrentServer] = useState<Server>(Default.server());
  const [directMessages, setDirectMessages] = useState<(DirectMessage | PromptMessage)[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // Memos
  const SHAKE_COOLDOWN = useMemo(() => 3, []);
  const MAX_LENGTH = useMemo(() => 2000, []);

  // Variables
  const { avatarUrl: userAvatarUrl } = user;
  const { avatarUrl: targetAvatarUrl, level: targetLevel, vip: targetVip, status: targetStatus, currentServerId: targetCurrentServerId, badges: targetBadges } = target;
  const { name: targetCurrentServerName } = targetCurrentServer;
  const isOnline = targetStatus !== 'offline';
  const isVerifiedUser = false; // TODO: Remove this after implementing

  // Handlers
  const handleSendMessage = (targetId: User['userId'], preset: Partial<DirectMessage>) => {
    ipcService.socket.send('directMessage', { targetId, preset });
  };

  const handleSendShakeWindow = () => {
    if (cooldown > 0) return;
    if (isFriend) ipcService.socket.send('shakeWindow', { targetId });
    else setDirectMessages((prev) => [...prev, { type: 'warn', content: t('non-friend-warning-message'), timestamp: Date.now(), parameter: {}, contentMetadata: {} }]);
    setCooldown(SHAKE_COOLDOWN);
    cooldownRef.current = SHAKE_COOLDOWN;
  };

  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }));
  };

  const handleDirectMessage = useCallback(
    (...args: DirectMessage[]) => {
      args.forEach((item) => {
        if (!item) return;
        // !! THIS IS IMPORTANT !!
        const user1Id = userId.localeCompare(targetId) < 0 ? userId : targetId;
        const user2Id = userId.localeCompare(targetId) < 0 ? targetId : userId;
        // Check if the message array is in the current conversation
        const isCurrentConversation = item.user1Id === user1Id && item.user2Id === user2Id;
        if (isCurrentConversation) setDirectMessages((prev) => [...prev, item]);
      });
    },
    [userId, targetId],
  );

  const handleShakeWindow = useCallback(
    (...args: DirectMessage[]) => {
      args.forEach((item) => {
        if (!item) return;
        // !! THIS IS IMPORTANT !!
        const user1Id = userId.localeCompare(targetId) < 0 ? userId : targetId;
        const user2Id = userId.localeCompare(targetId) < 0 ? targetId : userId;
        // Check if the message array is in the current conversation
        const isCurrentConversation = item.user1Id === user1Id && item.user2Id === user2Id;
        if (isCurrentConversation) setDirectMessages((prev) => [...prev, item]);
      });

      const start = performance.now();
      const shake = (time: number) => {
        const elapsed = time - start;
        if (elapsed > 500) {
          document.body.style.transform = 'translate(0, 0)';
          return;
        }
        const x = Math.round((Math.random() - 0.5) * 10);
        const y = Math.round((Math.random() - 0.5) * 10);
        document.body.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
      };
      requestAnimationFrame(shake);
    },
    [userId, targetId],
  );

  // Effects
  useEffect(() => {
    if (event === 'shakeWindow') handleShakeWindow(message);
    if (event === 'directMessage') handleDirectMessage(message);
  }, [event, message, handleDirectMessage, handleShakeWindow]);

  useEffect(() => {
    const id = setInterval(() => {
      if (cooldownRef.current === 0) return;
      const remaining = Math.max(0, cooldownRef.current - 1);
      setCooldown(remaining);
      cooldownRef.current = remaining;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!userId || !targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: userId }).then((user) => {
        if (user) setUser(user);
      });
      getService.user({ userId: targetId }).then((target) => {
        if (target) setTarget(target);
      });
      getService.friend({ userId: userId, targetId: targetId }).then((friend) => {
        if (friend) setIsFriend(true);
      });
    };
    refresh();
  }, [userId, targetId]);

  useEffect(() => {
    if (!targetId || !targetCurrentServerId) return;
    getService.server({ userId: targetId, serverId: targetCurrentServerId }).then((server) => {
      if (server) setTargetCurrentServer(server);
    });
  }, [targetId, targetCurrentServerId]);

  useEffect(() => {
    const unsubscribe = [ipcService.socket.on('directMessage', handleDirectMessage), ipcService.socket.on('shakeWindow', handleShakeWindow)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleDirectMessage, handleShakeWindow]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['header']}>
        <div className={styles['user-signature']}>{target.signature}</div>
        <div className={styles['direct-option-buttons']}>
          <div className={`${styles['file-share']} ${'disabled'}`} />
          <div className={`${styles['block-user']} ${'disabled'}`} />
          <div className={`${styles['un-block-user']} ${'disabled'}`} />
          <div className={`${styles['invite-temp-group']} ${'disabled'}`} />
          <div className={`${styles['report']} ${'disabled'}`} />
        </div>
      </div>

      {/* Body */}
      <div className={popup['popup-body']}>
        {/* Sidebar */}
        <div className={styles['sidebar']}>
          <div className={styles['target-box']}>
            <div className={`${styles['avatar-picture']} ${isFriend && isOnline ? '' : styles['offline']}`} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            {targetVip > 0 && <div className={`${vip['vip-icon-big']} ${vip[`vip-${targetVip}`]}`} />}
            <div className={styles['user-state-box']}>
              <div title={`${t('level')}: ${targetLevel}`} className={`${grade['grade']} ${grade[`lv-${Math.min(56, targetLevel)}`]}`} />
              {targetBadges.length > 0 ? <div className={styles['user-friend-split']} /> : ''}
              <BadgeList badges={JSON.parse(targetBadges)} maxDisplay={13} />
            </div>
          </div>
          <div className={styles['user-box']}>
            <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${userAvatarUrl})` }} />
          </div>
        </div>

        {/* Main Content */}
        <div className={styles['main-content']}>
          {isFriend && isOnline && targetCurrentServerId && (
            <div
              className={`${styles['action-area']} ${styles['clickable']}`}
              onClick={() => {
                handleServerSelect(targetCurrentServer.serverId, targetCurrentServer.displayId);
              }}
            >
              <div className={`${styles['action-icon']} ${styles['in-server']}`} />
              <div className={styles['action-title']}>{targetCurrentServerName}</div>
            </div>
          )}
          {(!isFriend || !isOnline) && (
            <div className={styles['action-area']}>
              {!isFriend && <div className={styles['action-title']}>{t('non-friend-message')}</div>}
              {isFriend && !isOnline && <div className={styles['action-title']}>{t('non-online-message')}</div>}
            </div>
          )}
          {isVerifiedUser && ( // TODO: Official badge
            <div className={styles['action-area']}>
              <div className={styles['action-icon']} />
              <div className={styles['action-title']}>{t('official-badge')}</div>
            </div>
          )}
          <div className={styles['message-area']}>
            <MessageViewer messages={directMessages} userId={userId} />
          </div>
          <div className={styles['input-area']}>
            <div className={styles['top-bar']}>
              <div className={styles['buttons']}>
                <div className={`${styles['button']} ${styles['font']}`} />
                <div
                  ref={emojiIconRef}
                  className={`${styles['button']} ${styles['emoji']}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!emojiIconRef.current) return;
                    const x = emojiIconRef.current.getBoundingClientRect().left;
                    const y = emojiIconRef.current.getBoundingClientRect().top;
                    contextMenu.showEmojiPicker(x, y, true, 'unicode', (emoji) => {
                      setMessageInput((prev) => prev + emoji);
                      if (textareaRef.current) textareaRef.current.focus();
                    });
                  }}
                />
                <div className={`${styles['button']} ${styles['screen-shot']}`} />
                <div className={`${styles['button']} ${styles['nudge']} ${!isFriend || cooldown > 0 ? 'disabled' : ''}`} onClick={handleSendShakeWindow} />
              </div>
              <div className={styles['buttons']}>
                <div className={styles['history-message']}>{t('message-history')}</div>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              className={styles['input']}
              value={messageInput}
              maxLength={MAX_LENGTH}
              onChange={(e) => {
                e.preventDefault();
                setMessageInput(e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                setMessageInput((prev) => prev + e.clipboardData.getData('text'));
              }}
              onKeyDown={(e) => {
                if (e.shiftKey) return;
                if (e.key !== 'Enter') return;
                else e.preventDefault();
                if (!messageInput.trim()) return;
                if (messageInput.length > MAX_LENGTH) return;
                if (isComposingRef.current) return;
                handleSendMessage(targetId, { type: 'dm', content: messageInput });
                setMessageInput('');
              }}
              onCompositionStart={() => (isComposingRef.current = true)}
              onCompositionEnd={() => (isComposingRef.current = false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

DirectMessagePopup.displayName = 'DirectMessagePopup';

export default DirectMessagePopup;
