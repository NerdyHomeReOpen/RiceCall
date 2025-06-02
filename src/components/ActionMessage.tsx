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

interface ActionMessageProps {
  messageGroup: EventMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const ActionMessage: React.FC<ActionMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
    } = messageGroup;

    const {
      nickname: targetNickname,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageSender;

    const { gender: receiverGender } = messageReceiver;

    const formatKey = {
      gender: receiverGender == 'Male' ? '你' : '妳',
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

ActionMessage.displayName = 'ActionMessage';

export default ActionMessage;
