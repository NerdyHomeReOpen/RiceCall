import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
import api from '@/services/api.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';
import { toTags } from '@/utils/tagConverter';

interface MessageInputBoxProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(({ onSend, disabled = false, placeholder = '', maxLength = 2000 }) => {
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

  // States
  const [messageInput, setMessageInput] = useState<string>('');

  // Memos
  const textLength = editor?.getText().length || 0;
  const isWarning = useMemo(() => textLength > maxLength, [textLength, maxLength]);

  // Handlers
  const syncStyles = useCallback(() => {
    fontSizeRef.current = editor?.getAttributes('textStyle').fontSize || '13px';
    textColorRef.current = editor?.getAttributes('textStyle').color || '#000000';
  }, [editor]);

  const handlePaste = async (imageData: string, fileName: string) => {
    isUploadingRef.current = true;
    if (imageData.length > 5 * 1024 * 1024) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    const formData = new FormData();
    formData.append('_type', 'announcement');
    formData.append('_fileName', `fileName-${Date.now()}`);
    formData.append('_file', imageData);
    const response = await api.post('/upload', formData);
    if (response) {
      editor?.chain().insertImage({ src: response.avatarUrl, alt: fileName }).focus().run();
      syncStyles();
    }
    isUploadingRef.current = false;
  };

  const handleEmojiSelect = (code: string) => {
    editor?.chain().insertEmoji({ code }).focus().run();
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
        placeholder={placeholder}
        className={`${messageInputBox['textarea']} ${markdown['markdown-content']}`}
        style={{ wordBreak: 'break-all', border: 'none', borderTop: '1px solid #ccc' }}
        onPaste={(e) => {
          const items = e.clipboardData.items;
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file && !isUploadingRef.current) {
                const reader = new FileReader();
                reader.onloadend = () => handlePaste(reader.result as string, file.name);
                reader.readAsDataURL(file);
              }
            }
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (isWarning) return;
          if (isComposingRef.current) return;
          if (e.shiftKey) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            if (messageInput.trim().length === 0) return;
            onSend?.(messageInput);
            editor?.chain().setContent('').setColor(textColorRef.current).setFontSize(fontSizeRef.current).focus().run();
            syncStyles();
          }
        }}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        maxLength={maxLength}
      />
      <div className={messageInputBox['message-input-length-text']}>
        {editor?.getText().length}/{maxLength}
      </div>
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
