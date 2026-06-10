import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { openAlertDialog, sendChannelMessage } from '@/services';

import { MAX_FILE_SIZE } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import { EmojiNode } from '@/extensions/EmojiNode';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/EmbedNode';
import { ImageNode } from '@/extensions/ImageNode';
import { ChatEnter } from '@/extensions/ChatEnter';

import { toTags } from '@/utils/tagConverter';

import styles from './Server.module.css';

const MessageInputBox: React.FC = React.memo(() => {
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
    onUpdate: ({ editor }) => (messageInputRef.current = toTags(editor.getHTML())),
    immediatelyRender: true,
  });

  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelTextIsMuted = useAppSelector((state) => state.currentChannel.data.isTextMuted);
  const currentChannelForbidText = useAppSelector((state) => state.currentChannel.data.forbidText);
  const currentChannelForbidGuestText = useAppSelector((state) => state.currentChannel.data.forbidGuestText);
  const currentChannelGuestTextMaxLength = useAppSelector((state) => state.currentChannel.data.guestTextMaxLength);
  const currentChannelGuestTextGapTime = useAppSelector((state) => state.currentChannel.data.guestTextGapTime);
  const currentChannelGuestTextWaitTime = useAppSelector((state) => state.currentChannel.data.guestTextWaitTime);

  const messageInputRef = useRef<string>('');
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');

  // TODO: change to ref maybe?
  const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  const textLength = editor?.getText().length || 0;
  const maxLength = permissionLevel < Types.Permission.Member ? currentChannelGuestTextMaxLength : 3000;
  const isCloseToMaxLength = textLength >= maxLength - 100;
  const isOverMaxLength = textLength > maxLength;
  const remainingGapTime = currentChannelGuestTextGapTime ? currentChannelGuestTextGapTime - (Date.now() - lastMessageTime) : 0;
  const remainingWaitTime = currentChannelGuestTextWaitTime ? currentChannelGuestTextWaitTime - (Date.now() - lastJoinChannelTime) : 0;
  const disabled =
    currentChannelTextIsMuted ||
    (permissionLevel < Types.Permission.ChannelMod && currentChannelForbidText) ||
    (permissionLevel < Types.Permission.Member && (currentChannelForbidGuestText || remainingWaitTime > 0 || remainingGapTime > 0));

  const setStyles = useCallback(() => {
    editor?.chain().setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
  }, [editor]);

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
      if (!item.type.startsWith('image/')) continue;

      const image = item.getAsFile();
      if (!image || isUploadingRef.current) continue;

      image.arrayBuffer().then((arrayBuffer) => {
        const imageUnit8Array = new Uint8Array(arrayBuffer);

        isUploadingRef.current = true;

        if (imageUnit8Array.length > MAX_FILE_SIZE) {
          openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
          isUploadingRef.current = false;
          return;
        }

        ipc.api
          .uploadImage({ folder: 'message', imageName: `${Date.now()}`, imageUnit8Array })
          .then((response) => {
            if (!response) return;
            editor?.chain().insertImage({ src: response.imageUrl, alt: image.name }).focus().run();
            setStyles();
          })
          .finally(() => {
            isUploadingRef.current = false;
          });
      });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || isOverMaxLength || isComposingRef.current || e.shiftKey || e.ctrlKey) return;

    if (e.key === 'Enter') {
      e.preventDefault();

      if (messageInputRef.current.trim().length === 0) return;

      sendChannelMessage(currentServerId, currentChannelId, { type: 'general', content: messageInputRef.current });
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

  useEffect(() => {
    editor?.on('selectionUpdate', setStyles);
  }, [editor, setStyles]);

  useEffect(() => {
    if (!currentChannelId) return;
    setLastJoinChannelTime(Date.now());
    setLastMessageTime(0);
  }, [currentChannelId]);

  return (
    <div className={`${styles['message-input-box']} ${isOverMaxLength ? styles['warning'] : ''}`}>
      <div className={styles['emoji-button']} onMouseDown={handleEmojiPickerClick} />
      <EditorContent
        editor={editor}
        className={`${styles['input']} markdown-content`}
        style={{ wordBreak: 'break-all', border: 'none' }}
        onPaste={handleInputPaste}
        onKeyDown={handleInputKeyDown}
        onCompositionStart={handleInputCompositionStart}
        onCompositionEnd={handleInputCompositionEnd}
        maxLength={maxLength}
      />
      {isCloseToMaxLength && (
        <div className={styles['input-length-text']}>
          {textLength}/{maxLength}
        </div>
      )}
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
