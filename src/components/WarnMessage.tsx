import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { WarnMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface WarnMessageProps {
  messageGroup: WarnMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const WarnMessage: React.FC<WarnMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
    } = messageGroup;

    const { nickname: senderNickname = null, name: senderName } =
      messageSender ?? {};

    const { nickname: targetNickname = null, name: targetName } =
      messageReceiver ?? {};

    const formatKey = {
      user: targetNickname || targetName,
      operator: senderNickname || senderName,
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
        'timeoutMemberMessage',
        '【{user}】被管理員【{operator}】踢出群',
      );
      content = content.replace(
        'blockedMemberMessage',
        '【{user}】被管理員【{operator}】封鎖',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['warnIcon']} />
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

WarnMessage.displayName = 'WarnMessage';

export default WarnMessage;
