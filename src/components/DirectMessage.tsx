import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { DirectMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface DirectMessageProps {
  messageGroup: DirectMessage & {
    contents: string[];
  };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ messageGroup }) => {
  // Hooks
  const lang = useLanguage();

  // Variables
  const { name: senderName, contents: messageContents, timestamp: messageTimestamp } = messageGroup;

  const timestamp = lang.getFormatTimestamp(messageTimestamp);

  const formatMessages = messageContents.map((content) => lang.getTranslatedMessage(content));

  return (
    <div className={styles['messageBox']}>
      <div className={styles['header']}>
        <div className={styles['username']}>{senderName}</div>
        <div className={styles['timestamp']}>{timestamp}</div>
      </div>
      {formatMessages.map((content, index) => (
        <MarkdownViewer key={index} markdownText={content} />
      ))}
    </div>
  );
});

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
