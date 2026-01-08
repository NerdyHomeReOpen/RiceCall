import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';
import { EmojiNode } from '@/extensions/EmojiNode';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/EmbedNode';
import { ImageNode } from '@/extensions/ImageNode';
import { ChatEnter } from '@/extensions/ChatEnter';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import * as TagConverter from '@/utils/tagConverter';

import { MAX_FILE_SIZE } from '@/constant';

import styles from '@/styles/messageInputBox.module.css';
import markdown from '@/styles/markdown.module.css';
import emoji from '@/styles/emoji.module.css';

interface MessageInputBoxProps {
  onMessageSend?: (message: string) => void;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(({ onMessageSend }) => {
  // Hooks
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: ({ editor }) => (editor.storage as unknown as { placeholder: string }).placeholder }),
      Color,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      TextStyle,
      FontFamily,
      FontSize,
      EmojiNode,
      YouTubeNode,
      TwitchNode,
      KickNode,
      ImageNode,
      ChatEnter,
    ],
    content: '',
    onUpdate: ({ editor }) => (messageInputRef.current = TagConverter.toTags(editor.getHTML())),
    immediatelyRender: true,
  });

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      guestTextMaxLength: state.currentChannel.data.guestTextMaxLength,
      guestTextGapTime: state.currentChannel.data.guestTextGapTime,
      guestTextWaitTime: state.currentChannel.data.guestTextWaitTime,
      isTextMuted: state.currentChannel.data.isTextMuted,
      forbidText: state.currentChannel.data.forbidText,
      forbidGuestText: state.currentChannel.data.forbidGuestText,
    }),
    shallowEqual,
  );

  // Refs
  const messageInputRef = useRef<string>('');
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');

  // States
  const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const textLength = editor?.getText().length || 0;
  const isCloseToMaxLength = textLength >= currentChannel.guestTextMaxLength - 100;
  const isWarning = textLength > currentChannel.guestTextMaxLength;
  const leftGapTime = currentChannel.guestTextGapTime ? currentChannel.guestTextGapTime - (Date.now() - lastMessageTime) : 0;
  const leftWaitTime = currentChannel.guestTextWaitTime ? currentChannel.guestTextWaitTime - (Date.now() - lastJoinChannelTime) : 0;
  const isForbidByMutedText = currentChannel.isTextMuted;
  const isForbidByForbidText = !Permission.isChannelMod(permissionLevel) && currentChannel.forbidText;
  const isForbidByForbidGuestText = !Permission.isMember(permissionLevel) && currentChannel.forbidGuestText;
  const isForbidByForbidGuestTextWait = !Permission.isMember(permissionLevel) && leftWaitTime > 0;
  const isForbidByForbidGuestTextGap = !Permission.isMember(permissionLevel) && leftGapTime > 0;
  const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
  const maxLength = !Permission.isMember(permissionLevel) ? currentChannel.guestTextMaxLength : 3000;

  // Functions
  const setStyles = useCallback(() => {
    editor?.chain().setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
  }, [editor]);

  // Handlers
  const handleEmojiSelect = (code: string) => {
    editor?.chain().insertEmoji({ code }).setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
    setStyles();
  };

  const handleFontSizeChange = (size: string) => {
    fontSizeRef.current = size;
    editor?.chain().setFontSize(size).focus().run();
  };

  const handleTextColorChange = (color: string) => {
    textColorRef.current = color;
    editor?.chain().setColor(color).focus().run();
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'right-top', e.currentTarget as HTMLElement, true, fontSizeRef.current, textColorRef.current, handleEmojiSelect, handleFontSizeChange, handleTextColorChange);
  };

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
              setStyles();
            }
            isUploadingRef.current = false;
          });
        });
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (isWarning) return;
    if (isComposingRef.current) return;
    if (e.shiftKey || e.ctrlKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (messageInputRef.current.trim().length === 0) return;
      onMessageSend?.(messageInputRef.current);
      setLastMessageTime(Date.now());
      editor?.chain().setContent('').setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
      setStyles();
    }
  };

  const handleInputCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleInputCompositionEnd = () => {
    isComposingRef.current = false;
  };

  // Effects
  useEffect(() => {
    editor?.on('selectionUpdate', setStyles);
  }, [editor, setStyles]);

  useEffect(() => {
    if (currentChannel.channelId) {
      setLastJoinChannelTime(Date.now());
      setLastMessageTime(0);
    }
  }, [currentChannel.channelId]);

  return (
    <div className={`${styles['message-input-box']} ${isWarning ? styles['warning'] : ''}`}>
      <div className={emoji['emoji-icon']} onMouseDown={handleEmojiPickerClick} />
      <EditorContent
        editor={editor}
        className={`${styles['textarea']} ${markdown['markdown-content']}`}
        style={{ wordBreak: 'break-all', border: 'none' }}
        onPaste={handleInputPaste}
        onKeyDown={handleInputKeyDown}
        onCompositionStart={handleInputCompositionStart}
        onCompositionEnd={handleInputCompositionEnd}
        maxLength={maxLength}
      />
      {isCloseToMaxLength && (
        <div className={styles['message-input-length-text']}>
          {textLength}/{maxLength}
        </div>
      )}
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
