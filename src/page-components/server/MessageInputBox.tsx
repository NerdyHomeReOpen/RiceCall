import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style';

import { Permission } from '@/types';

import * as ipc from '@/main/ipc';

import { openAlertDialog, sendChannelMessage } from '@/services';

import { MAX_FILE_SIZE } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import { EmojiNode } from '@/extensions/emoji-node';
import { YouTubeNode, TwitchNode, KickNode } from '@/extensions/embed-node';
import { ImageNode } from '@/extensions/image-node';
import { ChatEnter } from '@/extensions/chat-enter';

import { toTags } from '@/utils/tag-converter';

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
      guestTextGapSeconds: state.currentChannel.data.guestTextGapSeconds,
      guestTextWaitSeconds: state.currentChannel.data.guestTextWaitSeconds,
      isTextMuted: state.currentChannel.data.isTextMuted,
      forbidText: state.currentChannel.data.forbidText,
      forbidGuestText: state.currentChannel.data.forbidGuestText,
    }),
    shallowEqual,
  );

  const messageInputRef = useRef<string>('');
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');
  const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const textLength = editor?.getText().length || 0;
  const isCloseToMaxLength = textLength >= currentChannel.guestTextMaxLength - 100;
  const isWarning = textLength > currentChannel.guestTextMaxLength;
  const leftGapTime = currentChannel.guestTextGapSeconds ? currentChannel.guestTextGapSeconds - (Date.now() - lastMessageTime) : 0;
  const leftWaitTime = currentChannel.guestTextWaitSeconds ? currentChannel.guestTextWaitSeconds - (Date.now() - lastJoinChannelTime) : 0;
  const isForbidByMutedText = currentChannel.isTextMuted;
  const isForbidByForbidText = permissionLevel < Permission.ChannelMod && currentChannel.forbidText;
  const isForbidByForbidGuestText = permissionLevel < Permission.Member && currentChannel.forbidGuestText;
  const isForbidByForbidGuestTextWait = permissionLevel < Permission.Member && leftWaitTime > 0;
  const isForbidByForbidGuestTextGap = permissionLevel < Permission.Member && leftGapTime > 0;
  const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
  const maxLength = permissionLevel < Permission.Member ? currentChannel.guestTextMaxLength : 3000;

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
      sendChannelMessage(currentServer.serverId, currentChannel.channelId, { type: 'general', content: messageInputRef.current });
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
    if (currentChannel.channelId) {
      setLastJoinChannelTime(Date.now());
      setLastMessageTime(0);
    }
  }, [currentChannel.channelId]);

  return (
    <div
      className={`flex flex-1 flex-row gap-[5px] justify-start max-w-full p-[5px] bg-background border rounded-[5px] shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] ${isWarning ? 'border-text-warning' : 'border-border'}`}
    >
      <div
        className="w-[18px] h-[18px] bg-no-repeat bg-center bg-contain before:block before:min-w-[18px] before:min-h-[18px] before:cursor-pointer before:content-[''] before:bg-[url('/channel/FaceButton.svg')] before:bg-no-repeat before:bg-[position:0_0] hover:before:bg-[position:-18px_0] active:before:bg-[position:-36px_0]"
        onMouseDown={handleEmojiPickerClick}
      />
      <EditorContent
        editor={editor}
        className="flex-1 overflow-auto resize-none [&_div]:h-full markdown-content"
        style={{ wordBreak: 'break-all', border: 'none' }}
        onPaste={handleInputPaste}
        onKeyDown={handleInputKeyDown}
        onCompositionStart={handleInputCompositionStart}
        onCompositionEnd={handleInputCompositionEnd}
        maxLength={maxLength}
      />
      {isCloseToMaxLength && (
        <div className="absolute right-[5px] bottom-[5px] text-[0.9rem] text-text-color-senary">
          {textLength}/{maxLength}
        </div>
      )}
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
