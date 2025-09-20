import React, { useRef } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Styles
import emoji from '@/styles/emoji.module.css';

// Services
import ipc from '@/services/ipc.service';
import api from '@/services/api.service';

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

  // Refs
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handlers
  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  const handlePaste = async (imageData: string, fileName: string) => {
    isUploadingRef.current = true;
    if (imageData.length > 5 * 1024 * 1024) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    const formData = new FormData();
    formData.append('_type', 'message');
    formData.append('_fileName', `fileName-${Date.now()}`);
    formData.append('_file', imageData);
    const response = await api.post('/upload', formData);
    if (response) {
      textareaRef.current!.value += `![${fileName}](${response.avatarUrl})`;
    }
    isUploadingRef.current = false;
  };

  return (
    <div className={`${messageInputBox['messageinput-box']} ${disabled ? messageInputBox['disabled'] : ''}`}>
      <div
        className={emoji['emoji-icon']}
        onMouseDown={(e) => {
          e.preventDefault();
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showEmojiPicker(x, y, 'right-top', (_, full) => {
            textareaRef.current?.focus();
            document.execCommand('insertText', false, full);
          });
        }}
      />

      <textarea
        ref={textareaRef}
        rows={2}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={() => {
          if (disabled) return;
        }}
        onKeyDown={(e) => {
          const value = textareaRef.current?.value;
          if (e.shiftKey) return;
          if (e.key !== 'Enter') return;
          else e.preventDefault();
          if (!value) return;
          if (value.length > maxLength) return;
          if (isComposingRef.current) return;
          if (disabled) return;
          textareaRef.current!.value = '';
          onSend?.(value);
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
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        aria-label={t('message-input-box')}
      />
      <div className={messageInputBox['message-input-length-text']}>
        {textareaRef.current?.value.length}/{maxLength}
      </div>
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
