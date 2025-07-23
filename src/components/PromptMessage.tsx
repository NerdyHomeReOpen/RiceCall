import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface PromptMessageProps {
  messageGroup: PromptMessage & {
    contents: string[];
  };
  messageType?: string;
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { contents: messageContents, parameter: messageParameter } = messageGroup;

  const translatedMessages = messageContents.map((content) => {
    if (content.includes(' ')) {
      return content
        .split(' ')
        .map((_) => t(_, { ns: 'message', ...messageParameter }))
        .join(' ');
    } else {
      return t(content, { ns: 'message', ...messageParameter });
    }
  });

  return (
    <>
      <div className={styles['header']}>
        <div className={styles[`${messageType}-icon`]} />
      </div>

      <div className={styles['message-box']}>
        {translatedMessages.map((content, index) => (
          <MarkdownViewer key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
