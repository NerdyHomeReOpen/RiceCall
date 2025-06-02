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
    } = messageReceiver ?? {};

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
      // TODO: lang.tr
      content = content.replace(
        'updateMemberMessage',
        '加入了群，成為本群會員。',
      );
      content = content.replace(
        'updateChannelManagerMessage',
        '被提升為本頻道的頻道管理員。',
      );
      content = content.replace(
        'updateServerManagerMessage',
        '被提升為本群的管理員。',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageEvent']}>
          <div className={styles['infoIcon']} />
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
                <MarkdownViewer markdownText={getTranslatedContent(content)} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

EventMessage.displayName = 'EventMessage';

export default EventMessage;
