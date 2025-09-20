import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Utils
import { escapeHtml } from '@/utils/tagConverter';

interface PromptMessageProps {
  messageGroup: PromptMessage & {
    contents: string[];
  };
  messageType?: string;
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  // Hooks
  const { t } = useTranslation();

  // Destructuring
  const { contents: messageContents, parameter: messageParameter } = messageGroup;

  // Memos
  const escapedMessageParameter = useMemo(() => Object.fromEntries(Object.entries(messageParameter).map(([key, value]) => [key, escapeHtml(value)])), [messageParameter]);
  const translatedMessagesContents = useMemo(() => messageContents.map((content) => t(content, { ns: 'message', ...escapedMessageParameter })), [messageContents, escapedMessageParameter, t]);

  return (
    <>
      <div className={styles[`${messageType}-icon`]} />
      <div className={styles['message-box']}>
        {translatedMessagesContents.map((content, index) => (
          <MarkdownContent key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
