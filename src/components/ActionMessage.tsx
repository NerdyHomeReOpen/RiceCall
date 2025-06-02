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
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageSender ?? {};

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
        'removeFromMemberMessage',
        '移除了{gender}的會員身分。',
      );
      content = content.replace(
        'removeFromChannelManagerMessage',
        '移除了{gender}的頻道管理員身分。',
      );
      content = content.replace(
        'removeFromServerManagerMessage',
        '移除了{gender}的群管理員身分。',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageActionEvent']}>
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
                <MarkdownViewer
                  markdownText={format(
                    getTranslatedContent(content),
                    formatKey,
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

ActionMessage.displayName = 'ActionMessage';

export default ActionMessage;
