import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';
import markdown from '@/styles/markdown.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Styles
import emoji from '@/styles/emoji.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';
import { toTags } from '@/utils/tagConverter';

// Constants
import { MAX_FILE_SIZE } from '@/constant';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(({ onSendMessage, disabled = false, maxLength = 2000 }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
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
    onUpdate: ({ editor }) => setMessageInput(toTags(editor.getHTML())),
    immediatelyRender: true,
  });

  // Refs
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const fontSizeRef = useRef<string>('13px');
  const textColorRef = useRef<string>('#000000');

  // States
  const [messageInput, setMessageInput] = useState<string>('');

  // Variables
  const textLength = editor?.getText().length || 0;
  const isCloseToMaxLength = textLength >= maxLength - 100;
  const isWarning = textLength > maxLength;

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
  };

  const handleTextColorChange = (color: string) => {
    textColorRef.current = color;
    editor?.chain().setColor(color).focus().run();
    syncStyles();
  };

  // Effects
  useEffect(() => {
    editor?.on('selectionUpdate', syncStyles);
  }, [editor, syncStyles]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr);
  }, [editor]);

  return (
    <div className={`${messageInputBox['message-input-box']} ${disabled ? messageInputBox['disabled'] : ''} ${isWarning ? messageInputBox['warning'] : ''}`}>
      <div
        className={emoji['emoji-icon']}
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

      <EditorContent
        editor={editor}
        className={`${messageInputBox['textarea']} ${markdown['markdown-content']}`}
        style={{ wordBreak: 'break-all', border: 'none' }}
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
          if (disabled) return;
          if (isWarning) return;
          if (isComposingRef.current) return;
          if (e.shiftKey || e.ctrlKey) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            if (messageInput.trim().length === 0) return;
            onSendMessage?.(messageInput);
            editor?.chain().setContent('').setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
            syncStyles();
          }
        }}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        maxLength={maxLength}
      />
      {isCloseToMaxLength && (
        <div className={messageInputBox['message-input-length-text']}>
          {editor?.getText().length}/{maxLength}
        </div>
      )}
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
