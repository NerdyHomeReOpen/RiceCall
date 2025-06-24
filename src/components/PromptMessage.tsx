import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

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
  const lang = useLanguage();

  // Variables
  const { contents: messageContents, parameter: messageParameter } = messageGroup;

  const formatMessages = messageContents.map((content) => lang.getTranslatedMessage(content, messageParameter));

  return (
    <>
      <div className={styles['header']}>
        <div className={styles[`${messageType}Icon`]} />
      </div>

      <div className={styles['messageBox']}>
        {formatMessages.map((content, index) => (
          <MarkdownViewer key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
