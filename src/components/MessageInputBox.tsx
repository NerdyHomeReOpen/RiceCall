import React, { useRef, useState } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useLanguage } from '@/providers/Language';
import { useContextMenu } from '@/providers/ContextMenu';

// Styles
import emoji from '@/styles/emoji.module.css';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  warning?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({ onSendMessage, disabled = false, warning = false, placeholder = '', maxLength = 2000 }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Refs
    const emojiIconRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // States
    const [messageInput, setMessageInput] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);

    // Variables
    const isDisabled = disabled;
    const isWarning = warning || messageInput.length >= maxLength;

    return (
      <div
        className={`${messageInputBox['messageInputBox']} 
        ${isWarning ? messageInputBox['warning'] : ''} 
        ${isDisabled ? messageInputBox['disabled'] : ''}`}
      >
        <div
          ref={emojiIconRef}
          className={emoji['emojiIcon']}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!emojiIconRef.current) return;
            const x = emojiIconRef.current.getBoundingClientRect().x;
            const y = emojiIconRef.current.getBoundingClientRect().y;
            contextMenu.showEmojiPicker(x, y, true, 'unicode', (emoji) => {
              setMessageInput((prev) => prev + emoji);
              if (textareaRef.current) textareaRef.current.focus();
            });
          }}
        />

        <textarea
          ref={textareaRef}
          rows={2}
          placeholder={placeholder}
          value={messageInput}
          maxLength={maxLength}
          onChange={(e) => {
            if (isDisabled) return;
            setMessageInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.shiftKey) return;
            if (e.key !== 'Enter') return;
            else e.preventDefault();
            if (!messageInput.trim()) return;
            if (messageInput.length > maxLength) return;
            if (isComposing) return;
            if (isDisabled) return;
            if (isWarning) return;
            onSendMessage?.(messageInput);
            setMessageInput('');
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          aria-label={lang.tr.messageInputBox}
        />
        <div className={messageInputBox['messageInputLength']}>
          {messageInput.length}/{maxLength}
        </div>
      </div>
    );
  },
);

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
