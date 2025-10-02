import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Types
import { User, DirectMessage, Server, PromptMessage, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import DirectMessageContent from '@/components/DirectMessageContent';
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

// Services
import ipc from '@/services/ipc.service';
import data from '@/services/data.service';
import api from '@/services/api.service';

// CSS
import styles from '@/styles/popups/directMessage.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';

// Utils
import { handleOpenAlertDialog, handleOpenApplyFriend, handleOpenUserInfo } from '@/utils/popup';
import { fromTags, toTags } from '@/utils/tagConverter';

interface DirectMessagePopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  user: User;
  friend: Friend | null;
  target: User;
  event: 'directMessage' | 'shakeWindow';
  message: DirectMessage;
}

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(({ userId, targetId, user, friend, target, event, message }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const isComposingRef = useRef<boolean>(false);
  const cooldownRef = useRef<number>(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('small');
  const [textColor, setTextColor] = useState<string>('#000000');

  useEffect(() => {
    const savedFontSize = localStorage.getItem('messageInputBox-fontSize') as 'small' | 'medium' | 'large';
    const savedTextColor = localStorage.getItem('messageInputBox-textColor');

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedTextColor) setTextColor(savedTextColor);
  }, []);

  const updateFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('messageInputBox-fontSize', size);
  }, []);

  const updateTextColor = useCallback((color: string) => {
    setTextColor(color);
    localStorage.setItem('messageInputBox-textColor', color);
  }, []);

  // States
  const [targetCurrentServer, setTargetCurrentServer] = useState<Server | null>(null);
  const [friendState, setFriendState] = useState<Friend | null>(friend);
  const [directMessages, setDirectMessages] = useState<(DirectMessage | PromptMessage)[]>([]);
  const [cooldown, setCooldown] = useState<number>(0);

  // Memos
  const SHAKE_COOLDOWN = useMemo(() => 3, []);
  const MAX_LENGTH = useMemo(() => 2000, []);

  // Destructuring
  const { avatarUrl: userAvatarUrl } = user;
  const {
    userId: targetUserId,
    name: targetName,
    avatarUrl: targetAvatarUrl,
    level: targetLevel,
    xp: targetXp,
    requiredXp: targetRequiredXp,
    vip: targetVip,
    status: targetStatus,
    currentServerId: targetCurrentServerId,
    badges: targetBadges,
  } = target;
  const { name: targetCurrentServerName } = targetCurrentServer || {};

  // Memos
  const isFriend = useMemo(() => friendState?.relationStatus === 2, [friendState]);
  const isBlocked = useMemo(() => friendState?.isBlocked, [friendState]);
  const isOnline = useMemo(() => targetStatus !== 'offline', [targetStatus]);
  const isVerifiedUser = useMemo(() => false, []); // TODO: Remove this after implementing

  // Handlers
  const handleSendMessage = (targetId: User['userId'], preset: Partial<DirectMessage>) => {
    ipc.socket.send('directMessage', { targetId, preset });
  };

  const handleBlockUser = () => {
    handleOpenAlertDialog(t('confirm-block-user', { '0': targetName }), () => ipc.socket.send('blockUser', { targetId }));
  };

  const handleUnblockUser = () => {
    handleOpenAlertDialog(t('confirm-unblock-user', { '0': targetName }), () => ipc.socket.send('unblockUser', { targetId }));
  };

  const handlePaste = async (imageData: string, fileName: string) => {
    if (imageData.length > 5 * 1024 * 1024) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      return;
    }
    const formData = new FormData();
    formData.append('_type', 'message');
    formData.append('_fileName', `fileName-${Date.now()}`);
    formData.append('_file', imageData);
    const response = await api.post('/upload', formData);
    if (response) {
      editorRef.current?.focus();
      document.execCommand('insertText', false, `![${fileName}](${response.avatarUrl})`);
    }
  };

  const insertHtmlAtCaret = useCallback((html: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.appendChild(document.createTextNode(''));
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const fragment = document.createDocumentFragment();
    let node: ChildNode | null;
    let lastNode: ChildNode | null = null;
    while ((node = temp.firstChild)) {
      lastNode = fragment.appendChild(node);
    }
    range.insertNode(fragment);
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }, []);

  const handleSendShakeWindow = () => {
    if (cooldown > 0) return;
    if (isFriend) ipc.socket.send('shakeWindow', { targetId });
    else setDirectMessages((prev) => [...prev, { type: 'warn', content: t('non-friend-warning-message'), timestamp: Date.now(), parameter: {}, contentMetadata: {} }]);
    setCooldown(SHAKE_COOLDOWN);
    cooldownRef.current = SHAKE_COOLDOWN;
  };

  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }));
  };

  const handleFriendUpdate = useCallback(
    (...args: { targetId: User['userId']; update: Partial<Friend> }[]) => {
      if (targetId !== targetUserId) return;
      setFriendState((prev) => ({ ...prev, ...args[0].update }) as Friend);
    },
    [targetId, targetUserId],
  );

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
        if (isCurrentConversation) {
          setDirectMessages((prev) => [...prev, item]);

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
        }
      });
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
    if (!targetId || !targetCurrentServerId) return;
    data.server({ userId: targetId, serverId: targetCurrentServerId }).then((server) => {
      if (server) setTargetCurrentServer(server);
    });
  }, [targetId, targetCurrentServerId]);

  useEffect(() => {
    if (!friendState) {
      ipc.socket.send('stranger', { targetId });
    }
  }, [friendState, targetId]);

  useEffect(() => {
    const unsubscribe = [ipc.socket.on('friendUpdate', handleFriendUpdate), ipc.socket.on('directMessage', handleDirectMessage), ipc.socket.on('shakeWindow', handleShakeWindow)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleFriendUpdate, handleDirectMessage, handleShakeWindow]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['header']}>
        <div className={styles['user-signature']}>{target.signature}</div>
        <div className={styles['direct-option-buttons']}>
          <div className={`${styles['file-share']} ${'disabled'}`} />
          {!isFriend ? (
            <div className={styles['apply-friend']} onClick={() => handleOpenApplyFriend(userId, targetId)} />
          ) : (
            <>
              {!isBlocked ? <div className={styles['block-user']} onClick={handleBlockUser} /> : <div className={styles['un-block-user']} onClick={handleUnblockUser} />}
              <div className={`${styles['invite-temp-group']} ${'disabled'}`} />
            </>
          )}
          <div className={`${styles['report']} ${'disabled'}`} />
        </div>
      </div>

      {/* Body */}
      <div className={popup['popup-body']}>
        {/* Sidebar */}
        <div className={styles['sidebar']}>
          <div className={styles['target-box']}>
            <div
              className={`${styles['avatar-picture']} ${styles['clickable']} ${isFriend && isOnline ? '' : styles['offline']}`}
              style={{ backgroundImage: `url(${targetAvatarUrl})` }}
              onClick={() => handleOpenUserInfo(userId, targetId)}
            />
            {targetVip > 0 && <div className={`${vip['vip-icon-big']} ${vip[`vip-${targetVip}`]}`} />}
            <div className={styles['user-state-box']}>
              <LevelIcon level={targetLevel} xp={targetXp} requiredXp={targetRequiredXp} />
              {targetBadges.length > 0 ? <div className={styles['user-friend-split']} /> : ''}
              <BadgeList badges={JSON.parse(targetBadges)} position="left-bottom" direction="right-bottom" maxDisplay={13} />
            </div>
          </div>
          <div className={styles['user-box']}>
            <div className={`${styles['avatar-picture']} ${styles['clickable']}`} style={{ backgroundImage: `url(${userAvatarUrl})` }} onClick={() => handleOpenUserInfo(userId, userId)} />
          </div>
        </div>

        {/* Main Content */}
        <div className={styles['main-content']}>
          {isFriend && isOnline && targetCurrentServerId && (
            <div
              className={`${styles['action-area']} ${styles['clickable']}`}
              onClick={() => {
                if (!targetCurrentServer) return;
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
            <DirectMessageContent messages={directMessages} user={user} />
          </div>
          <div className={styles['input-area']}>
            <div className={styles['top-bar']}>
              <div className={styles['buttons']}>
                <div className={`${styles['button']} ${styles['font']}`} />
                <div
                  className={`${styles['button']} ${styles['emoji']}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const x = e.currentTarget.getBoundingClientRect().left;
                    const y = e.currentTarget.getBoundingClientRect().top;
                    contextMenu.showEmojiPicker(
                      x,
                      y,
                      'right-top',
                      (_, full) => {
                        editorRef.current?.focus();
                        const html = fromTags(full);
                        insertHtmlAtCaret(html);
                      },
                      e.currentTarget as HTMLElement,
                      true,
                      false,
                      fontSize,
                      textColor,
                      updateFontSize,
                      updateTextColor,
                    );
                  }}
                />
                <div className={`${styles['button']} ${styles['screen-shot']}`} />
                <div className={`${styles['button']} ${styles['nudge']} ${!isFriend || cooldown > 0 ? 'disabled' : ''}`} onClick={handleSendShakeWindow} />
              </div>
              <div className={styles['buttons']}>
                <div className={styles['history-message']}>{t('message-history')}</div>
              </div>
            </div>
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label={t('message-input-box')}
              data-placeholder={`${t('input-message')}...`}
              className={styles['input']}
              style={{
                outline: 'none',
                whiteSpace: 'pre-wrap',
                fontSize: fontSize === 'small' ? '14px' : fontSize === 'medium' ? '16px' : '18px',
                color: textColor,
              }}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                for (const item of items) {
                  if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => handlePaste(reader.result as string, file.name);
                      reader.readAsDataURL(file);
                    }
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.shiftKey) return;
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (isComposingRef.current) return;
                let html = editorRef.current?.innerHTML || '';
                html = html.replace(/^(?:<br\s*\/>|<br>)+/gi, '').replace(/(?:<br\s*\/>|<br>)+$/gi, '');
                const value = toTags(html).trim();
                if (!value) return;
                if (value.length > MAX_LENGTH) return;

                const styledValue = `<style data-font-size="${fontSize}" data-text-color="${textColor}">${value}</style>`;
                if (editorRef.current) {
                  editorRef.current.innerHTML = '';
                }
                handleSendMessage(targetId, { type: 'dm', content: styledValue });
              }}
              onCompositionStart={() => (isComposingRef.current = true)}
              onCompositionEnd={() => (isComposingRef.current = false)}
              suppressContentEditableWarning
              onInput={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

DirectMessagePopup.displayName = 'DirectMessagePopup';

export default DirectMessagePopup;
