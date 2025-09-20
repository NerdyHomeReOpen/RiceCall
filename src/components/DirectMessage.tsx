import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { DirectMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import MarkdownContent from '@/components/MarkdownContent';

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

  // Destructuring
  const { name: senderName, contents: messageContents, timestamp: messageTimestamp } = messageGroup;

  // Memos
  const formattedTimestamp = useMemo(() => getFormatTimestamp(t, messageTimestamp), [t, messageTimestamp]);
  const formattedMessageContents = useMemo(() => messageContents.map((content) => (content.startsWith('message:') ? t(content) : content)), [messageContents, t]);

  return (
    <div className={styles['message-box']}>
      <div className={styles['header']}>
        <div className={styles['username-text']}>{senderName}</div>
        <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
