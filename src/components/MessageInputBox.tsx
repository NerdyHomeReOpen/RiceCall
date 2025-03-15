import React, { useState } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import EmojiGrid from './EmojiGrid';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({ onSendMessage }) => {
    // Language
    const lang = useLanguage();

    // Input Control
    const [messageInput, setMessageInput] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const MAXLENGTH = 2000;

    // Emoji Picker Control
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

    return (
      <div
        className={`flex flex-1 flex-row justify-flex-start p-1 border rounded-lg ${
          messageInput.length >= MAXLENGTH ? 'border-red-500' : ''
        }`}
      >
        <div
          className={styles['emojiIcon']}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />

        {showEmojiPicker && (
          <EmojiGrid
            onEmojiSelect={(emojiTag) => {
              const content = messageInput + emojiTag;
              if (content.length > MAXLENGTH) return;
              setMessageInput(content);
              setShowEmojiPicker(false);
              const input = document.querySelector('textarea');
              if (input) input.focus();
            }}
          />
        )}
        <textarea
          className="w-full p-1 resize-none focus:outline-none 
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar]:h-2 
                [&::-webkit-scrollbar-thumb]:bg-gray-300 
                [&::-webkit-scrollbar-thumb]:rounded-lg 
                [&::-webkit-scrollbar-thumb]:hover:bg-gray-400"
          rows={2}
          placeholder={lang.tr.inputMessage}
          value={messageInput}
          onChange={(e) => {
            e.preventDefault();
            const input = e.target.value;
            setMessageInput(input);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            setMessageInput((prev) => prev + text);
          }}
          onKeyDown={(e) => {
            if (e.shiftKey) return;
            if (e.key !== 'Enter') return;
            if (!messageInput.trim()) return;
            if (messageInput.length > MAXLENGTH) return;
            if (isComposing) return;
            e.preventDefault();
            onSendMessage?.(messageInput);
            setMessageInput('');
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          maxLength={MAXLENGTH}
          aria-label={lang.tr.messageInputBox}
        />
        <div className="text-xs text-gray-400 self-end ml-2">
          {messageInput.length}/{MAXLENGTH}
        </div>
      </div>
    );
  },
);

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
