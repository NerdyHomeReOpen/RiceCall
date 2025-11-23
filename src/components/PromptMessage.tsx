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
import { getPermissionText } from '@/utils/language';

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
  const escapedMessageParameter = Object.fromEntries(Object.entries(messageParameter).map(([key, value]) => [key, escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: getPermissionText(t, parseInt(messageParameter.userPermissionLevel)) } }))
          .join(' '),
      ),
    [messageContents, escapedMessageParameter, messageParameter, t],
  );

  return (
    <>
      <div className={styles[`${messageType}-icon`]} />
      <div className={styles['message-box']}>
        {formattedMessagesContents.map((content, index) => (
          <MarkdownContent key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
