import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';

import type * as Types from '@/types';
import { RelationStatus } from '@/types';

import * as ipc from '@/main/ipc';

import { sendMessage, openApplyFriend, blockUser, unblockUser, openUserInfo, openChatHistory, openAlertDialog } from '@/services';

import { MAX_FILE_SIZE, MAX_INPUT_LENGTH, SHAKE_COOLDOWN, DEFAULT_USER_AVATAR_URL, REPORT_BASE_URL } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import { EmojiNode } from '@/extensions/emoji-node';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/embed-node';
import { ImageNode } from '@/extensions/image-node';
import { ChatEnter } from '@/extensions/chat-enter';

import MessageContent from '@/components/message-content';
import BadgeList from '@/components/badge-list';
import LevelIcon from '@/components/level-icon';
import UnreadMessageAlert from '@/components/unread-message-alert';

import { toTags } from '@/utils/tag-converter';

type DirectMessagePopupProps = Types.PopupInitialData['directMessage'];

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(({ target, event, message }) => {
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

  const editor = useEditor({
    extensions: [StarterKit, Color, TextAlign.configure({ types: ['paragraph', 'heading'] }), TextStyle, FontFamily, FontSize, EmojiNode, YouTubeNode, TwitchNode, KickNode, ImageNode, ChatEnter],
    content: '',
    onUpdate: ({ editor }) => setMessageInput(toTags(editor.getHTML())),
    immediatelyRender: false,
  });

  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      avatarUrl: state.user.data.avatarUrl,
    }),
    shallowEqual,
  );

  const [messageInput, setMessageInput] = useState<string>('');
  const [targetCurrentServer, setTargetCurrentServer] = useState<Types.Server | null>(null);
  const [directMessages, setDirectMessages] = useState<(Types.DirectMessage | Types.PromptMessage)[]>([]);
  const [canShakeWindow, setCanShakeWindow] = useState<boolean>(true);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const textLength = editor?.getText().length || 0;
  const isWarning = textLength > MAX_INPUT_LENGTH;
  const isFriend = friends.find((f) => f.targetId === target.userId && f.relationStatus === RelationStatus.Friend) !== undefined;
  const isBlocked = friends.find((f) => f.targetId === target.userId && f.isBlocked) !== undefined;
  const isOffline = target.status === 'offline';
  const isOnlineFriend = isFriend && !isOffline;
  const hasVip = target.vip > 0;
  const badges = typeof target.badges === 'string' ? JSON.parse(target.badges) : target.badges;
  const hasBadges = badges.length > 0;

  const syncStyles = useCallback(() => {
    fontSizeRef.current = editor?.getAttributes('textStyle').fontSize || '13px';
    textColorRef.current = editor?.getAttributes('textStyle').color || '#000000';
  }, [editor]);

  const scrollToBottom = useCallback(() => {
    if (!messageAreaRef.current) return;
    messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
    setIsAtBottom(true);
  }, []);

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
            openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
            isUploadingRef.current = false;
            return;
          }

          ipc.api.uploadImage({ folder: 'message', imageName: `${Date.now()}`, imageUnit8Array }).then((response) => {
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
      sendMessage(target.userId, { type: 'dm', content: messageInput });
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
    localStorage.setItem('dm-font-size', size);
  };

  const handleTextColorChange = (color: string) => {
    textColorRef.current = color;
    editor?.chain().setColor(color).focus().run();
    syncStyles();
    localStorage.setItem('dm-text-color', color);
  };

  const handleShakeWindowBtnClick = () => {
    if (shakeTimeoutRef.current) return;

    if (isFriend) {
      ipc.socket.send('shakeWindow', { targetId: target.userId });
    } else {
      setDirectMessages((prev) => [...prev, { type: 'warn', content: t('non-friend-warning-message'), timestamp: Date.now(), parameter: {}, contentMetadata: {} }]);
    }

    setCanShakeWindow(false);

    shakeTimeoutRef.current = setTimeout(() => {
      setCanShakeWindow(true);
      shakeTimeoutRef.current = null;
    }, SHAKE_COOLDOWN);
  };

  const handleServerSelect = (server: Types.Server) => {
    ipc.server.select({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() });
  };

  const handleScroll = () => {
    if (!messageAreaRef.current) return;
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;
    setIsAtBottom(isBottom);
  };

  const handleUnreadMessageAlertClick = () => {
    scrollToBottom();
  };

  const handleApplyFriendBtnClick = () => {
    openApplyFriend(user.userId, target.userId);
  };

  const handleBlockUserBtnClick = () => {
    blockUser(target.userId, target.name);
  };

  const handleUnblockUserBtnClick = () => {
    unblockUser(target.userId, target.name);
  };

  const handleReportBtnClick = () => {
    window.open(`${REPORT_BASE_URL}?type=user&id=${encodeURIComponent(target.userId)}`, '_blank');
  };

  const handleTargetAvatarClick = () => {
    openUserInfo(target.userId);
  };

  const handleUserAvatarClick = () => {
    openUserInfo(user.userId);
  };

  const handleServerNameClick = () => {
    if (targetCurrentServer) handleServerSelect(targetCurrentServer);
  };

  const handleMessageHistoryBtnClick = () => {
    openChatHistory(target.userId);
  };

  const handleScreenShotBtnClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploadingRef.current) return;
    e.target.value = '';

    file.arrayBuffer().then((arrayBuffer) => {
      const imageUnit8Array = new Uint8Array(arrayBuffer);
      isUploadingRef.current = true;

      if (imageUnit8Array.length > MAX_FILE_SIZE) {
        openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
        isUploadingRef.current = false;
        return;
      }

      ipc.api.uploadImage({ folder: 'message', imageName: `${Date.now()}`, imageUnit8Array }).then((response) => {
        if (response) {
          editor?.chain().insertImage({ src: response.imageUrl, alt: file.name }).focus().run();
          syncStyles();
        }

        isUploadingRef.current = false;
      });
    });
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'right-top', e.currentTarget as HTMLElement, true, fontSizeRef.current, textColorRef.current, handleEmojiSelect, handleFontSizeChange, handleTextColorChange);
  };

  useEffect(() => {
    editor?.on('selectionUpdate', syncStyles);
  }, [editor, syncStyles]);

  useEffect(() => {
    if (!target.userId || !target.shareCurrentServer || isBlocked || !isFriend || !targetCurrentServer) {
      setTargetCurrentServer(null);
      return;
    }

    ipc.api.fetchServer({ userId: target.userId, serverId: targetCurrentServer.serverId }).then((server) => {
      if (server) setTargetCurrentServer(server);
    });
  }, [target.userId, target.shareCurrentServer, targetCurrentServer, isBlocked, isFriend]);

  useEffect(() => {
    if (!isFriend) ipc.socket.send('stranger', { targetId: target.userId });
  }, [isFriend, target.userId]);

  useEffect(() => {
    if (!messageAreaRef.current || directMessages.length === 0) return;
    const lastMessage = directMessages[directMessages.length - 1];
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= 100;

    if (lastMessage.type !== 'dm' || lastMessage.userId === user.userId) {
      setTimeout(() => scrollToBottom(), 50);
    } else if (isBottom) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [directMessages, user.userId, scrollToBottom]);

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
    const onDirectMessage = (...args: Types.DirectMessage[]) => {
      args.forEach((item) => {
        if (!item) return;
        const user1Id = user.userId.localeCompare(target.userId) < 0 ? user.userId : target.userId;
        const user2Id = user.userId.localeCompare(target.userId) < 0 ? target.userId : user.userId;
        const isCurrentConversation = item.user1Id === user1Id && item.user2Id === user2Id;
        if (isCurrentConversation) setDirectMessages((prev) => [...prev, item]);
      });
    };

    if (event === 'directMessage' && message) onDirectMessage(message);
    const unsub = ipc.socket.on('directMessage', onDirectMessage);
    return () => unsub();
  }, [event, message, user.userId, target.userId]);

  useEffect(() => {
    const onShakeWindow = (...args: Types.DirectMessage[]) => {
      args.forEach((item) => {
        if (!item) return;
        const user1Id = user.userId.localeCompare(target.userId) < 0 ? user.userId : target.userId;
        const user2Id = user.userId.localeCompare(target.userId) < 0 ? target.userId : user.userId;
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

    if (event === 'shakeWindow' && message) onShakeWindow(message);
    const unsub = ipc.socket.on('shakeWindow', onShakeWindow);
    return () => unsub();
  }, [event, message, user.userId, target.userId]);

  return (
    <div className="popup-wrapper">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInputChange} />
      <div className="flex flex-col items-start w-full px-[10px] pb-[5px] text-secondary-color bg-main-color bg-(image:--header-image) bg-no-repeat bg-position-[0_-30px] bg-cover">
        <div className="min-h-[1.5em] ml-[18px]">{target.signature}</div>
        <div className="flex gap-[5px] [justify-content:left] ml-[18px] [-webkit-app-region:no-drag]">
          {}
          {!isFriend ? (
            <div className="inline-block min-w-[30px] min-h-[30px] align-middle cursor-pointer bg-no-repeat bg-center bg-contain bg-[url('/im/AddContact.svg')]" onClick={handleApplyFriendBtnClick} />
          ) : (
            <>
              {!isBlocked ? (
                <div className="inline-block min-w-[30px] min-h-[30px] align-middle cursor-pointer bg-no-repeat bg-center bg-contain bg-[url('/im/BlockUser.svg')]" onClick={handleBlockUserBtnClick} />
              ) : (
                <div
                  className="inline-block min-w-[30px] min-h-[30px] align-middle cursor-pointer bg-no-repeat bg-center bg-contain bg-[url('/im/UnblockUser.svg')]"
                  onClick={handleUnblockUserBtnClick}
                />
              )}
              {}
            </>
          )}
          <div className="inline-block min-w-[30px] min-h-[30px] align-middle cursor-pointer bg-no-repeat bg-center bg-contain bg-[url('/im/report.svg')]" onClick={handleReportBtnClick} />
        </div>
      </div>
      <div className="popup-body">
        <div className="flex flex-col items-center justify-between w-fit h-full p-[10px] border-r border-border">
          <div className="flex flex-col gap-[5px]">
            <div
              className={`relative w-[100px] h-[100px] m-[10px] cursor-pointer before:absolute before:-top-[10px] before:-left-[10px] before:z-1 before:min-w-[120px] before:min-h-[120px] before:content-[''] before:bg-[url('/im/logoframe.svg')] before:bg-no-repeat before:bg-center before:bg-cover ${isFriend && !isOffline ? '' : 'grayscale'}`}
              onClick={handleTargetAvatarClick}
            >
              <Image src={target.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="target_avatar" width={100} height={100} loading="lazy" draggable="false" />
            </div>
            {hasVip && <div className={`vip-icon-big vip-${target.vip}`} />}
            <div className="flex flex-nowrap">
              <LevelIcon level={target.level} xp={target.xp} requiredXp={target.requiredXp} showTooltip={false} />
              {hasBadges ? <div className="w-[2px] h-[15px] mx-[10px] bg-[url('/mf_spliter.svg')] bg-cover" /> : ''}
              <BadgeList badges={JSON.parse(target.badges)} position="left-bottom" direction="right-bottom" maxDisplay={13} grid={true} />
            </div>
          </div>
          <div>
            <div
              className="relative w-[100px] h-[100px] m-[10px] cursor-pointer before:absolute before:-top-[10px] before:-left-[10px] before:z-1 before:min-w-[120px] before:min-h-[120px] before:content-[''] before:bg-[url('/im/logoframe.svg')] before:bg-no-repeat before:bg-center before:bg-cover"
              onClick={handleUserAvatarClick}
            >
              <Image src={user.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="user_avatar" width={100} height={100} loading="lazy" draggable="false" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <div className="relative">
            {isOnlineFriend && targetCurrentServer && (
              <div
                className="group flex items-center w-full h-[22px] after:absolute after:-bottom-px after:left-1/2 after:w-full after:h-[22px] after:content-[''] after:bg-[url('/im/serverin_bkg.svg')] after:bg-no-repeat after:bg-center after:bg-contain after:[transform:translateX(-50%)] cursor-pointer"
                onClick={handleServerNameClick}
              >
                <div className="min-w-[14px] min-h-[14px] ml-[10px] bg-no-repeat bg-position-[0_0] bg-contain bg-[url('/im/server_in.svg')]" />
                <div className="w-full ml-[5px] group-hover:underline">{targetCurrentServer.name}</div>
              </div>
            )}
            {!isOnlineFriend && (
              <div className="flex items-center w-full h-[22px] after:absolute after:-bottom-px after:left-1/2 after:w-full after:h-[22px] after:content-[''] after:bg-[url('/im/serverin_bkg.svg')] after:bg-no-repeat after:bg-center after:bg-contain after:[transform:translateX(-50%)]">
                {!isFriend && <div className="w-full ml-[5px]">{t('non-friend-message')}</div>}
                {isFriend && isOffline && <div className="w-full ml-[5px]">{t('non-online-message')}</div>}
              </div>
            )}
            {target.isVerified ? (
              <div className="flex items-center w-full h-[22px] after:absolute after:-bottom-px after:left-1/2 after:w-full after:h-[22px] after:content-[''] after:bg-[url('/im/serverin_bkg.svg')] after:bg-no-repeat after:bg-center after:bg-contain after:[transform:translateX(-50%)]">
                <div className="w-[17px] h-[16px] min-w-[14px] min-h-[14px] ml-[10px] [image-rendering:auto] bg-[url('/official.svg')] bg-no-repeat bg-center bg-cover" />
                <div className="flex items-center w-full ml-[5px]">
                  <span className="text-[#636363]">{t('official-title')}</span>
                  <span className="ml-[10px] text-[#0084e3]">{t('is-official')}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div ref={messageAreaRef} onScroll={handleScroll} className="flex flex-[5] flex-col pt-[10px] px-[10px] pb-0 overflow-x-hidden overflow-y-scroll">
            <MessageContent messages={directMessages} />
            <div style={{ minHeight: '10px' }} />
            <UnreadMessageAlert unreadMessageCount={unreadMessageCount} onAlertClick={handleUnreadMessageAlertClick} />
          </div>
          <div className="flex flex-col w-full h-[150px] overflow-hidden">
            <div className="flex justify-between min-w-full min-h-[30px] bg-[url('/tool_bkg.svg')] bg-no-repeat bg-position-[0_0] bg-size-[100%] border-y border-border">
              <div className="flex items-center ml-[5px]">
                {}
                <div className="min-w-[18px] min-h-[18px] mr-[10px] cursor-pointer bg-position-[0_0] bg-[url('/FaceButton.svg')]" onMouseDown={handleEmojiPickerClick} />
                <div className="min-w-[18px] min-h-[18px] mr-[10px] cursor-pointer bg-position-[0_0] bg-[url('/ScreenShot.svg')]" onClick={handleScreenShotBtnClick} />
                <div
                  className={`min-w-[18px] min-h-[18px] mr-[10px] cursor-pointer bg-position-[0_0] bg-[url('/im/Nudge.svg')] ${!isFriend || !canShakeWindow ? 'disabled' : ''}`}
                  onClick={handleShakeWindowBtnClick}
                />
              </div>
              <div className="flex items-center ml-[5px]">
                <div
                  className="flex items-center w-auto h-full mr-[15px] cursor-pointer before:min-w-[18px] before:min-h-[18px] before:mr-[3px] before:content-[''] before:bg-[url('/im/history.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-contain disabled"
                  onClick={handleMessageHistoryBtnClick}
                >
                  {t('message-history')}
                </div>
              </div>
            </div>
            <EditorContent
              editor={editor}
              placeholder={t('input-message')}
              className={`block flex-1 p-[8px] overflow-auto resize-none [&_div]:h-full markdown-content ${isWarning ? 'border! border-text-warning!' : 'border-none!'}`}
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
