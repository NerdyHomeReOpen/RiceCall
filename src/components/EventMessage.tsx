import React from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { EventMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface EventMessageProps {
  messageGroup: EventMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const EventMessage: React.FC<EventMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const { receiver: messageReceiver, contents: messageContents } =
      messageGroup;

    const {
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageReceiver;

    const formatKey = {
      gender: targetGender == 'Male' ? '你' : '妳',
    };

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content, formatKey),
    );

    return (
      <>
        <div className={styles['header']}>
          <div className={styles['infoIcon']} />
          <div
            className={`${styles['gradeIcon']} ${permission[targetGender]} ${
              permission[`lv-${targetPermissionLevel}`]
            }`}
          />
          <div className={styles['username']}>
            {targetNickname || targetName}
          </div>
        </div>
        <div className={styles['messageBox']}>
          {formatMessages.map((content, index) => (
            <div key={index}>
              <MarkdownViewer markdownText={content} />
            </div>
          ))}
        </div>
      </>
    );
  },
);

EventMessage.displayName = 'EventMessage';

export default EventMessage;
