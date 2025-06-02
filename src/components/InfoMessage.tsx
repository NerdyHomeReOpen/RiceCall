import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { InfoMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface InfoMessageProps {
  messageGroup: InfoMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const InfoMessage: React.FC<InfoMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      // sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
    } = messageGroup;

    const { gender: receiverGender } = messageReceiver ?? {};

    const formatKey = {
      gender: receiverGender == 'Male' ? '你' : '妳',
    };

    const format = (
      template: string,
      values: Record<string, string>,
    ): string => {
      let result = template;
      for (const key in values) {
        result = result.replace(`{${key}}`, values[key]);
      }
      return result;
    };

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
        'upgradeServerManagerMessage',
        '{gender}已被提升為本群的管理員。',
      );
      content = content.replace(
        'upgradeChannelManagerMessage',
        '{gender}已被提升為本頻道的管理員。',
      );
      content = content.replace(
        'upgradeMemberMessage',
        '{gender}已加入成為本群會員。',
      );

      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['infoIcon']} />
        <div className={styles['messageBox']}>
          {messageContents.map((content, index) => (
            <div key={index}>
              <MarkdownViewer
                markdownText={format(getTranslatedContent(content), formatKey)}
              />
            </div>
          ))}
        </div>
      </>
    );
  },
);

InfoMessage.displayName = 'InfoMessage';

export default InfoMessage;
