import React, { useState } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import emojis, { Emoji } from './emojis';

interface EmojiGridProps {
  onEmojiSelect?: (emoji: string) => void;
}

const EmojiGrid: React.FC<EmojiGridProps> = ({ onEmojiSelect }) => {
  return (
    <div className={messageInputBox['emojiGrid']}>
      {emojis.map((emoji: Emoji) => (
        <div
          key={emoji.id}
          className={messageInputBox['emoji']}
          data-id={emoji.id + 1}
          onClick={() => {
            onEmojiSelect?.(`[emoji_${emoji.id}]`);
          }}
        />
      ))}
    </div>
  );
};

EmojiGrid.displayName = 'EmojiGrid';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  warning?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({
    onSendMessage,
    disabled = false,
    warning = false,
    placeholder = '',
    maxLength = 2000,
  }) => {
    // Language
    const lang = useLanguage();

    // States
    const [messageInput, setMessageInput] = useState<string>('');
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
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
          className={messageInputBox['emojiIcon']}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          {showEmojiPicker && (
            <EmojiGrid
              onEmojiSelect={(emojiTag) =>
                setMessageInput((prev) => prev + emojiTag)
              }
            />
          )}
        </div>

        <textarea
          rows={2}
          placeholder={placeholder}
          value={messageInput}
          onChange={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setMessageInput(e.target.value);
          }}
          onPaste={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setMessageInput((prev) => prev + e.clipboardData.getData('text'));
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
          maxLength={maxLength}
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
