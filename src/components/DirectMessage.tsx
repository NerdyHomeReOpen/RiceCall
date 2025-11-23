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

// Constants
import { ALLOWED_MESSAGE_KEYS } from '@/constant';

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
  const formattedMessageContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageContents, t],
  );

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
