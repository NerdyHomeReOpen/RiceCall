import React, { useEffect } from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Utils
import Default from '@/utils/default';

interface PromptMessageProps {
  messageGroup: PromptMessage & {
    contents: string[];
  };
  messageType?: string;
  isActionMessage: boolean;
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(
  ({ messageGroup, messageType = 'info', isActionMessage }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      contents: messageContents,
      parameter: messageParameter,
      operator: messageOperator,
      target: messageTarget,
    } = messageGroup;

    const isAlertMessage = messageType === 'alert';
    const isEventMessage = messageType === 'event';
    const isAlertOrEvent = isAlertMessage || isEventMessage;

    const {
      name: userName,
      gender: userGender,
      permissionLevel: userPermissionLevel,
    } = {
      ...Default.serverMember(),
      ...(isActionMessage || isAlertMessage ? messageOperator : messageTarget),
    };

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content, messageParameter),
    );

    return (
      <>
        <div className={styles['header']}>
          <div className={styles[`${messageType}Icon`]} />
        </div>
        {isAlertOrEvent && (
          <>
            <div
              className={`
                ${styles['gradeIcon']}
                ${permission[userGender]}
                ${permission[`lv-${userPermissionLevel}`]}`}
            />
            <div className={styles['username']}>
              {userName}
            </div>
          </>
        )}
        <div className={styles['messageBox']}>
          {formatMessages.map((content, index) => (
            <MarkdownViewer key={index} markdownText={content} />
          ))}
        </div>
      </>
    );
  },
);

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
