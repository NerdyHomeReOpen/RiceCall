import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Utils
import { getTranslatedMessage } from '@/utils/language';

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

  const translatedMessages = messageContents.map((content) => getTranslatedMessage(t, content, messageParameter));

  return (
    <>
      <div className={styles['header']}>
        <div className={styles[`${messageType}Icon`]} />
      </div>

      <div className={styles['messageBox']}>
        {translatedMessages.map((content, index) => (
          <MarkdownViewer key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
