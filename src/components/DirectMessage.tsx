import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { DirectMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Utils
import { getFormatTimestamp } from '@/utils/language';

interface DirectMessageProps {
  messageGroup: DirectMessage & {
    contents: string[];
  };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ messageGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { name: senderName, contents: messageContents, timestamp: messageTimestamp } = messageGroup;
  const formattedTimestamp = getFormatTimestamp(t, messageTimestamp);

  return (
    <div className={styles['message-box']}>
      <div className={styles['header']}>
        <div className={styles['username-text']}>{senderName}</div>
        <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
      </div>
      {messageContents.map((content, index) => (
        <MarkdownViewer key={index} markdownText={content} />
      ))}
    </div>
  );
});

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
