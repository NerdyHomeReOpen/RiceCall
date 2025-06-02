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

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageActionEvent']}>
          <div className={styles['alertIcon']} />
          <div
            className={`
            ${styles['senderIcon']}
            ${permission[targetGender]}
            ${permission[`lv-${targetPermissionLevel}`]}
          `}
          />
          <div className={styles['username']}>
            {targetNickname || targetName}
          </div>
          <div className={styles['messageBox']}>
            {messageContents.map((content, index) => (
              <div key={index}>
                <MarkdownViewer
                  markdownText={`${
                    messageChannelId !== null ? '頻道廣播：' : '群廣播：'
                  }${getTranslatedContent(content)}`}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

AlertMessage.displayName = 'AlertMessage';

export default AlertMessage;
