import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';
import { EmojiNode } from '@/extensions/EmojiNode';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/EmbedNode';
import { ImageNode } from '@/extensions/ImageNode';
import { ChatEnter } from '@/extensions/ChatEnter';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import DirectMessageContent from '@/components/DirectMessageContent';
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';
import * as TagConverter from '@/utils/tagConverter';

import { MAX_FILE_SIZE, MAX_INPUT_LENGTH, SHAKE_COOLDOWN } from '@/constant';

import styles from '@/styles/directMessage.module.css';
import markdownStyles from '@/styles/markdown.module.css';
import popupStyles from '@/styles/popup.module.css';
import messageStyles from '@/styles/message.module.css';
import vipStyles from '@/styles/vip.module.css';

interface DirectMessagePopupProps {
  friend: Types.Friend | null;
  target: Types.User;
  event: 'directMessage' | 'shakeWindow';
  message: Types.DirectMessage;
}

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(({ friend: friendData, target, event, message }) => {
  // Hooks
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();
  const editor = useEditor({
    extensions: [StarterKit, Color, TextAlign.configure({ types: ['paragraph', 'heading'] }), TextStyle, FontFamily, FontSize, EmojiNode, YouTubeNode, TwitchNode, KickNode, ImageNode, ChatEnter],
    content: '',
    onUpdate: ({ editor }) => setMessageInput(TagConverter.toTags(editor.getHTML())),
    immediatelyRender: false,
  });

  // Refs
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');
  const cooldownRef = useRef<number>(0);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // States
  const [messageInput, setMessageInput] = useState<string>('');
  const [targetCurrentServer, setTargetCurrentServer] = useState<Types.Server | null>(null);
  const [friend, setFriend] = useState<Types.Friend | null>(friendData);
  const [directMessages, setDirectMessages] = useState<(Types.DirectMessage | Types.PromptMessage)[]>([]);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  // Variables
  const { userId, avatarUrl: userAvatarUrl } = user;
  const {
    userId: targetId,
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
  const isFriend = friend?.relationStatus === 2;
  const isBlocked = friend?.isBlocked;
  const isOnline = targetStatus !== 'offline';

  // Functions
  const syncStyles = useCallback(() => {
    fontSizeRef.current = editor?.getAttributes('textStyle').fontSize || '13px';
    textColorRef.current = editor?.getAttributes('textStyle').color || '#000000';
  }, [editor]);

  const scrollToBottom = useCallback(() => {
    if (!messageAreaRef.current) return;
    messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
    setIsAtBottom(true);
  }, []);

  // Handlers
  const handleInputPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const image = item.getAsFile();
        if (!image || isUploadingRef.current) return;
        image.arrayBuffer().then((arrayBuffer) => {
          const imageUnit8Array = new Uint8Array(arrayBuffer);
          isUploadingRef.current = true;
          if (imageUnit8Array.length > MAX_FILE_SIZE) {
            Popup.openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
            isUploadingRef.current = false;
            return;
          }
          ipc.data.uploadImage({ folder: 'message', imageName: `${Date.now()}`, imageUnit8Array }).then((response) => {
            if (response) {
              editor?.chain().insertImage({ src: response.imageUrl, alt: image.name }).focus().run();
              syncStyles();
            }
            isUploadingRef.current = false;
          });
        });
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isWarning) return;
    if (isComposingRef.current) return;
    if (e.shiftKey || e.ctrlKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (messageInput.trim().length === 0) return;
      Popup.sendMessage(targetId, { type: 'dm', content: messageInput });
      editor?.chain().setContent('').setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
      syncStyles();
    }
  };

  const handleInputCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleInputCompositionEnd = () => {
    isComposingRef.current = false;
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

  const handleShakeWindowBtnClick = () => {
    if (cooldown > 0) return;
    if (isFriend) ipc.socket.send('shakeWindow', { targetId });
    else setDirectMessages((prev) => [...prev, { type: 'warn', content: t('non-friend-warning-message'), timestamp: Date.now(), parameter: {}, contentMetadata: {} }]);
    setCooldown(SHAKE_COOLDOWN);
    cooldownRef.current = SHAKE_COOLDOWN;
  };

  const handleServerSelect = (server: Types.Server) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() }));
  };

  const handleScroll = () => {
    if (!messageAreaRef.current) return;
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;
    setIsAtBottom(isBottom);
  };

  const handleNewMessageAlertClick = () => {
    scrollToBottom();
  };

  const handleApplyFriendBtnClick = () => {
    Popup.openApplyFriend(userId, targetId);
  };

  const handleBlockUserBtnClick = () => {
    Popup.blockUser(targetId, targetName);
  };

  const handleUnblockUserBtnClick = () => {
    Popup.unblockUser(targetId, targetName);
  };

  const handleReportBtnClick = () => {
    // window.open('https://ricecall.com/report-user', '_blank');
  };

  const handleTargetAvatarClick = () => {
    Popup.openUserInfo(userId, targetId);
  };

  const handleUserAvatarClick = () => {
    Popup.openUserInfo(userId, userId);
  };

  const handleServerNameClick = () => {
    if (targetCurrentServer) handleServerSelect(targetCurrentServer);
  };

  const handleMessageHistoryBtnClick = () => {
    Popup.openChatHistory(userId, targetId);
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'right-top', e.currentTarget as HTMLElement, true, fontSizeRef.current, textColorRef.current, handleEmojiSelect, handleFontSizeChange, handleTextColorChange);
  };

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
    ipc.data.server({ userId: targetId, serverId: targetCurrentServerId }).then((server) => {
      if (server) setTargetCurrentServer(server);
    });
  }, [targetId, targetCurrentServerId, isBlocked, isFriend, targetShareCurrentServer]);

  useEffect(() => {
    if (!friend) ipc.socket.send('stranger', { targetId });
  }, [friend, targetId]);

  useEffect(() => {
    if (!messageAreaRef.current || directMessages.length === 0) return;

    const lastMessage = directMessages[directMessages.length - 1];
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;

    if (lastMessage.type !== 'dm' || lastMessage.userId === userId) {
      setTimeout(() => scrollToBottom(), 50);
    } else if (isBottom) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [directMessages, userId, scrollToBottom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') scrollToBottom();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scrollToBottom]);

  useEffect(() => {
    if (isAtBottom) setUnreadMessageCount(0);
  }, [isAtBottom]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args: { targetId: Types.User['userId']; update: Partial<Types.Friend> }[]) => {
      const match = args.find((i) => String(i.targetId) === String(targetId));
      if (match) setFriend((prev) => (prev ? { ...prev, ...match.update } : Default.friend(match.update)));
    });
    return () => unsub();
  }, [targetId]);

  useEffect(() => {
    const onDirectMessage = (...args: Types.DirectMessage[]) => {
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
    const onShakeWindow = (...args: Types.DirectMessage[]) => {
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
    <div className={popupStyles['popup-wrapper']}>
      <div className={styles['header']}>
        <div className={styles['user-signature']}>{target.signature}</div>
        <div className={styles['direct-option-buttons']}>
          <div className={`${styles['file-share']} disabled`} />
          {!isFriend ? (
            <div className={styles['apply-friend']} onClick={handleApplyFriendBtnClick} />
          ) : (
            <>
              {!isBlocked ? <div className={styles['block-user']} onClick={handleBlockUserBtnClick} /> : <div className={styles['un-block-user']} onClick={handleUnblockUserBtnClick} />}
              <div className={`${styles['invite-temp-group']} disabled`} />
            </>
          )}
          <div className={`${styles['report']} disabled`} onClick={handleReportBtnClick} />
        </div>
      </div>
      <div className={popupStyles['popup-body']}>
        <div className={styles['sidebar']}>
          <div className={styles['target-box']}>
            <div className={`${styles['avatar-picture']} ${isFriend && isOnline ? '' : styles['offline']}`} style={{ backgroundImage: `url(${targetAvatarUrl})` }} onClick={handleTargetAvatarClick} />
            {targetVip > 0 && <div className={`${vipStyles['vip-icon-big']} ${vipStyles[`vip-${targetVip}`]}`} />}
            <div className={styles['user-state-box']}>
              <LevelIcon level={targetLevel} xp={targetXp} requiredXp={targetRequiredXp} showTooltip={false} />
              {targetBadges.length > 0 ? <div className={styles['user-friend-split']} /> : ''}
              <BadgeList badges={JSON.parse(targetBadges)} position="left-bottom" direction="right-bottom" maxDisplay={13} grid={true} />
            </div>
          </div>
          <div className={styles['user-box']}>
            <div className={`${styles['avatar-picture']}`} style={{ backgroundImage: `url(${userAvatarUrl})` }} onClick={handleUserAvatarClick} />
          </div>
        </div>
        <div className={styles['main-content']}>
          <div className={styles['action-body']}>
            {isFriend && isOnline && targetCurrentServer ? (
              <div className={`${styles['action-area']} ${styles['clickable']}`} onClick={handleServerNameClick}>
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
            <DirectMessageContent messages={directMessages} />
            <div style={{ minHeight: '10px' }} />
            {unreadMessageCount > 0 && (
              <div className={messageStyles['new-message-alert']} onClick={handleNewMessageAlertClick}>
                {t('has-new-message', { 0: unreadMessageCount })}
              </div>
            )}
          </div>
          <div className={styles['input-area']}>
            <div className={styles['top-bar']}>
              <div className={styles['buttons']}>
                <div className={`${styles['button']} ${styles['font']} disabled`} />
                <div className={`${styles['button']} ${styles['emoji']}`} onMouseDown={handleEmojiPickerClick} />
                <div className={`${styles['button']} ${styles['screen-shot']} disabled`} />
                <div className={`${styles['button']} ${styles['nudge']} ${!isFriend || cooldown > 0 ? 'disabled' : ''}`} onClick={handleShakeWindowBtnClick} />
              </div>
              <div className={styles['buttons']}>
                <div className={`${styles['history-message']} disabled`} onClick={handleMessageHistoryBtnClick}>
                  {t('message-history')}
                </div>
              </div>
            </div>
            <EditorContent
              editor={editor}
              placeholder={t('input-message')}
              className={`${styles['input']} ${markdownStyles['markdown-content']} ${isWarning ? styles['warning'] : ''}`}
              style={{ wordBreak: 'break-all', border: 'none', borderTop: '1px solid #ccc' }}
              onPaste={handleInputPaste}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={handleInputCompositionStart}
              onCompositionEnd={handleInputCompositionEnd}
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
