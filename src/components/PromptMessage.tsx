import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownContent from '@/components/MarkdownContent';

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
  const translatedMessages = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((_) => t(_, { ns: 'message', ...messageParameter }))
          .join(' '),
      ),
    [messageContents, messageParameter, t],
  );

  return (
    <>
      <div className={styles[`${messageType}-icon`]} />
      <div className={styles['message-box']}>
        {translatedMessages.map((content, index) => (
          <MarkdownContent key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
