import React from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { AlertMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface AlertMessageProps {
  messageGroup: AlertMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const AlertMessage: React.FC<AlertMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      contents: messageContents,
      channelId: messageChannelId = null,
    } = messageGroup;

    const {
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageSender ?? {};

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content),
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
              <MarkdownViewer
                markdownText={`${
                  messageChannelId !== null ? '頻道廣播：' : '群廣播：'
                }${content}`}
              />
            </div>
          ))}
        </div>
      </>
    );
  },
);

AlertMessage.displayName = 'AlertMessage';

export default AlertMessage;
