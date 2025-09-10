import React, { useRef } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Styles
import emoji from '@/styles/emoji.module.css';

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
  const isComposingRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
