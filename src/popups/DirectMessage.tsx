import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';
import { EmojiNode } from '@/extensions/EmojiNode';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/EmbedNode';
import { ImageNode } from '@/extensions/ImageNode';
import { ChatEnter } from '@/extensions/ChatEnter';

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
import ipc from '@/ipc';

// CSS
import styles from '@/styles/directMessage.module.css';
import markdown from '@/styles/markdown.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import messageStyles from '@/styles/message.module.css';

// Utils
import { handleOpenAlertDialog, handleOpenApplyFriend, handleOpenChatHistory, handleOpenUserInfo } from '@/utils/popup';
import { toTags } from '@/utils/tagConverter';

// Constants
import { MAX_FILE_SIZE, MAX_INPUT_LENGTH, SHAKE_COOLDOWN } from '@/constant';

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
  const editor = useEditor({
    extensions: [StarterKit, Color, TextAlign.configure({ types: ['paragraph', 'heading'] }), TextStyle, FontFamily, FontSize, EmojiNode, YouTubeNode, TwitchNode, KickNode, ImageNode, ChatEnter],
    content: '',
    onUpdate: ({ editor }) => setMessageInput(toTags(editor.getHTML())),
    immediatelyRender: false,
  });

  // Refs
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');
  const cooldownRef = useRef<number>(0);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  // States
  const [messageInput, setMessageInput] = useState<string>('');
  const [targetCurrentServer, setTargetCurrentServer] = useState<Server | null>(null);
  const [friendState, setFriendState] = useState<Friend | null>(friend);
  const [directMessages, setDirectMessages] = useState<(DirectMessage | PromptMessage)[]>([]);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  // Variables
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
    shareCurrentServer: targetShareCurrentServer,
    isVerified: isTargetVerified,
  } = target;
  const { name: targetCurrentServerName } = targetCurrentServer || {};
  const textLength = editor?.getText().length || 0;
  const isWarning = textLength > MAX_INPUT_LENGTH;
  const isFriend = friendState?.relationStatus === 2;
  const isBlocked = friendState?.isBlocked;
  const isOnline = targetStatus !== 'offline';

  // Handlers
  const syncStyles = useCallback(() => {
    fontSizeRef.current = editor?.getAttributes('textStyle').fontSize || '13px';
    textColorRef.current = editor?.getAttributes('textStyle').color || '#000000';
  }, [editor]);

  const handleUploadImage = (imageUnit8Array: Uint8Array, imageName: string) => {
    isUploadingRef.current = true;
    if (imageUnit8Array.length > MAX_FILE_SIZE) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    ipc.data.uploadImage('message', `${Date.now()}`, imageUnit8Array).then((response) => {
      if (response) {
        editor?.chain().insertImage({ src: response.imageUrl, alt: imageName }).focus().run();
        syncStyles();
      }
      isUploadingRef.current = false;
    });
  };

  const handleEmojiSelect = (code: string) => {
    editor?.chain().insertEmoji({ code }).setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
    syncStyles();
  };

  const handleFontSizeChange = (size: string) => {
    fontSizeRef.current = size;
    editor?.chain().setFontSize(size).focus().run();
    syncStyles();
    localStorage.setItem('dm-fontSize', size);
  };

  const handleTextColorChange = (color: string) => {
    textColorRef.current = color;
    editor?.chain().setColor(color).focus().run();
    syncStyles();
    localStorage.setItem('dm-textColor', color);
  };

  const handleSendMessage = (targetId: User['userId'], preset: Partial<DirectMessage>) => {
    ipc.socket.send('directMessage', { targetId, preset });
  };

  const handleBlockUser = () => {
    handleOpenAlertDialog(t('confirm-block-user', { '0': targetName }), () => ipc.socket.send('blockUser', { targetId }));
  };

  const handleUnblockUser = () => {
    handleOpenAlertDialog(t('confirm-unblock-user', { '0': targetName }), () => ipc.socket.send('unblockUser', { targetId }));
  };

  const handleSendShakeWindow = () => {
    if (cooldown > 0) return;
    if (isFriend) ipc.socket.send('shakeWindow', { targetId });
    else setDirectMessages((prev) => [...prev, { type: 'warn', content: t('non-friend-warning-message'), timestamp: Date.now(), parameter: {}, contentMetadata: {} }]);
    setCooldown(SHAKE_COOLDOWN);
    cooldownRef.current = SHAKE_COOLDOWN;
  };

  const handleServerSelect = (server: Server) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() }));
  };

  const handleScroll = () => {
    if (!messageAreaRef.current) return;
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;
    setIsAtBottom(isBottom);
  };

  const handleScrollToBottom = useCallback(() => {
    if (!messageAreaRef.current) return;
    messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
    setIsAtBottom(true);
  }, []);

  // Effects
  useEffect(() => {
    editor?.on('selectionUpdate', syncStyles);
  }, [editor, syncStyles]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (cooldownRef.current === 0) return;
      const remaining = Math.max(0, cooldownRef.current - 1);
      setCooldown(remaining);
      cooldownRef.current = remaining;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!targetId || !targetCurrentServerId || isBlocked || !isFriend || !targetShareCurrentServer) {
      setTargetCurrentServer(null);
      return;
    }
    ipc.data.server(targetId, targetCurrentServerId).then((server) => {
      if (server) setTargetCurrentServer(server);
    });
  }, [targetId, targetCurrentServerId, isBlocked, isFriend, targetShareCurrentServer]);

  useEffect(() => {
    if (!friendState) ipc.socket.send('stranger', { targetId });
  }, [friendState, targetId]);

  useEffect(() => {
    if (!messageAreaRef.current || directMessages.length === 0) return;

    const lastMessage = directMessages[directMessages.length - 1];
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;

    if (lastMessage.type !== 'dm' || lastMessage.userId === userId) {
      setTimeout(() => handleScrollToBottom(), 50);
    } else if (isBottom) {
      setTimeout(() => handleScrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [directMessages, userId, handleScrollToBottom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleScrollToBottom();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleScrollToBottom]);

  useEffect(() => {
    if (isAtBottom) setUnreadMessageCount(0);
  }, [isAtBottom]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args: { targetId: User['userId']; update: Partial<Friend> }[]) => {
      if (targetId !== targetUserId) return;
      setFriendState((prev) => ({ ...prev, ...args[0].update }) as Friend);
    });
    return () => unsub();
  }, [targetId, targetUserId]);

  useEffect(() => {
    const onDirectMessage = (...args: DirectMessage[]) => {
      args.forEach((item) => {
        if (!item) return;
        // !! THIS IS IMPORTANT !!
        const user1Id = userId.localeCompare(targetId) < 0 ? userId : targetId;
        const user2Id = userId.localeCompare(targetId) < 0 ? targetId : userId;
        // Check if the message array is in the current conversation
        const isCurrentConversation = item.user1Id === user1Id && item.user2Id === user2Id;
        if (isCurrentConversation) setDirectMessages((prev) => [...prev, item]);
      });
    };
    if (event === 'directMessage') onDirectMessage(message);
    const unsub = ipc.socket.on('directMessage', onDirectMessage);
    return () => unsub();
  }, [event, message, userId, targetId]);

  useEffect(() => {
    const onShakeWindow = (...args: DirectMessage[]) => {
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
    };
    if (event === 'shakeWindow') onShakeWindow(message);
    const unsub = ipc.socket.on('shakeWindow', onShakeWindow);
    return () => unsub();
  }, [event, message, userId, targetId]);

  return (
    <div className={popup['popup-wrapper']}>
      <div className={styles['header']}>
        <div className={styles['user-signature']}>{target.signature}</div>
        <div className={styles['direct-option-buttons']}>
          <div className={`${styles['file-share']} disabled`} />
          {!isFriend ? (
            <div className={styles['apply-friend']} onClick={() => handleOpenApplyFriend(userId, targetId)} />
          ) : (
            <>
              {!isBlocked ? <div className={styles['block-user']} onClick={handleBlockUser} /> : <div className={styles['un-block-user']} onClick={handleUnblockUser} />}
              <div className={`${styles['invite-temp-group']} disabled`} />
            </>
          )}
          <div className={`${styles['report']} disabled`} />
        </div>
      </div>
      <div className={popup['popup-body']}>
        <div className={styles['sidebar']}>
          <div className={styles['target-box']}>
            <div
              className={`${styles['avatar-picture']} ${isFriend && isOnline ? '' : styles['offline']}`}
              style={{ backgroundImage: `url(${targetAvatarUrl})` }}
              onClick={() => handleOpenUserInfo(userId, targetId)}
            />
            {targetVip > 0 && <div className={`${vip['vip-icon-big']} ${vip[`vip-${targetVip}`]}`} />}
            <div className={styles['user-state-box']}>
              <LevelIcon level={targetLevel} xp={targetXp} requiredXp={targetRequiredXp} />
              {targetBadges.length > 0 ? <div className={styles['user-friend-split']} /> : ''}
              <BadgeList badges={JSON.parse(targetBadges)} position="left-bottom" direction="right-bottom" maxDisplay={13} grid={true} />
            </div>
          </div>
          <div className={styles['user-box']}>
            <div className={`${styles['avatar-picture']}`} style={{ backgroundImage: `url(${userAvatarUrl})` }} onClick={() => handleOpenUserInfo(userId, userId)} />
          </div>
        </div>
        <div className={styles['main-content']}>
          <div className={styles['action-body']}>
            {isFriend && isOnline && targetCurrentServer ? (
              <div className={`${styles['action-area']} ${styles['clickable']}`} onClick={() => handleServerSelect(targetCurrentServer)}>
                <div className={`${styles['action-icon']} ${styles['in-server']}`} />
                <div className={styles['action-title']}>{targetCurrentServerName}</div>
              </div>
            ) : !isFriend || !isOnline ? (
              <div className={styles['action-area']}>
                {!isFriend && <div className={styles['action-title']}>{t('non-friend-message')}</div>}
                {isFriend && !isOnline && <div className={styles['action-title']}>{t('non-online-message')}</div>}
              </div>
            ) : null}
            {isTargetVerified ? (
              <div className={styles['action-area']}>
                <div className={`${styles['action-icon']} ${styles['is-official-icon']}`} />
                <div className={`${styles['official-title-box']} ${styles['action-title']}`}>
                  <span className={styles['is-official-title']}>{t('official-title')}</span>
                  <span className={styles['is-official-text']}>{t('is-official')}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div ref={messageAreaRef} onScroll={handleScroll} className={styles['message-area']}>
            <DirectMessageContent messages={directMessages} user={user} />
            <div style={{ minHeight: '10px' }}></div>
            {unreadMessageCount > 0 && (
              <div className={messageStyles['new-message-alert']} onClick={handleScrollToBottom}>
                {t('has-new-message', { 0: unreadMessageCount })}
              </div>
            )}
          </div>
          <div className={styles['input-area']}>
            <div className={styles['top-bar']}>
              <div className={styles['buttons']}>
                <div className={`${styles['button']} ${styles['font']} disabled`} />
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
                      e.currentTarget as HTMLElement,
                      true,
                      false,
                      fontSizeRef.current,
                      textColorRef.current,
                      (code) => handleEmojiSelect(code),
                      (size) => handleFontSizeChange(size),
                      (color) => handleTextColorChange(color),
                    );
                  }}
                />
                <div className={`${styles['button']} ${styles['screen-shot']} disabled`} />
                <div className={`${styles['button']} ${styles['nudge']} ${!isFriend || cooldown > 0 ? 'disabled' : ''}`} onClick={handleSendShakeWindow} />
              </div>
              <div className={styles['buttons']}>
                <div className={`${styles['history-message']} disabled`} onClick={() => handleOpenChatHistory(userId, targetId)}>
                  {t('message-history')}
                </div>
              </div>
            </div>
            <EditorContent
              editor={editor}
              placeholder={t('input-message')}
              className={`${styles['input']} ${markdown['markdown-content']} ${isWarning ? styles['warning'] : ''}`}
              style={{ wordBreak: 'break-all', border: 'none', borderTop: '1px solid #ccc' }}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                for (const item of items) {
                  if (item.type.startsWith('image/')) {
                    const image = item.getAsFile();
                    if (!image || isUploadingRef.current) return;
                    image.arrayBuffer().then((arrayBuffer) => {
                      handleUploadImage(new Uint8Array(arrayBuffer), image.name);
                    });
                  }
                }
              }}
              onKeyDown={(e) => {
                if (isWarning) return;
                if (isComposingRef.current) return;
                if (e.shiftKey || e.ctrlKey) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (messageInput.trim().length === 0) return;
                  handleSendMessage(targetId, { type: 'dm', content: messageInput });
                  editor?.chain().setContent('').setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
                  syncStyles();
                }
              }}
              onCompositionStart={() => (isComposingRef.current = true)}
              onCompositionEnd={() => (isComposingRef.current = false)}
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

DirectMessagePopup.displayName = 'DirectMessagePopup';

export default DirectMessagePopup;
