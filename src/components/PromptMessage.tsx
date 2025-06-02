import React, { JSX } from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { PromptMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface PromptMessageProps {
  messageGroup: PromptMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
  messageType: string;
  isActionMessage: boolean;
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(
  ({ messageGroup, forbidGuestUrl, messageType = 'info', isActionMessage = false }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
      channelId: messageChannelId,
    } = messageGroup;

    const isInfoOrEvent = messageType === 'info' || messageType === 'event';
    const isEventOrAlert = messageType === 'event' || messageType === 'alert';
    const isWarn = messageType === 'warn';
    const isAlertInAction = messageType === 'alert' && isActionMessage;
    const isEventInChannel = messageType === 'event' && !isActionMessage;

    // using in Event Message, Sender to Action, Receiver to Channel
    const target = (isActionMessage && !isWarn) ? messageSender : messageReceiver;
    const {
      name: targetName = '',
      nickname: targetNickname = null,
      permissionLevel: targetPermissionLevel = 1,
      gender: targetGender = 'Male',
    } = target ?? {};


    const { // in Info Message, Sender is null
      name: senderName = '',
      nickname: senderNickname = null,
    } = messageSender ?? {};


    const { // in Alert Message, Receiver is null
      name: receiverName = '',
      nickname: receiverNickname = null,
      gender: receiverGender = 'Male',
    } = messageReceiver ?? {};

    // Functions
    const getFormatKey = (): Record<string, string> | undefined => {
      if (isActionMessage && isInfoOrEvent) {
        return { gender: receiverGender === 'Male' ? '你' : '妳' };
      }
      if (isWarn) {
        return {
          user: receiverNickname ?? receiverName,
          operator: senderNickname ?? senderName,
        };
      }
      return {
        user: receiverNickname ?? receiverName,
        operator: senderNickname ?? senderName,
      };
    };

    const getHeaderElements = () => {
      const iconMap: Record<string, JSX.Element> = {
        info: <div className={styles['infoIcon']} />,
        warn: <div className={styles['warnIcon']} />,
        event: <div className={styles['infoIcon']} />,
        alert: <div className={styles['alertIcon']} />,
      };

      return (
        <>
          {iconMap[messageType] ?? ''}
          {(isEventOrAlert) && (
            <>
              <div className={`
                ${styles['gradeIcon']}
                ${permission[targetGender]}
                ${permission[`lv-${targetPermissionLevel}`]}
              `} />
              <div className={styles['username']}>
                {targetNickname || targetName}
              </div>
            </>
          )}
        </>
      );
    };

    const getContentWithType = (content: string): string =>
      isAlertInAction
        ? `${messageChannelId ? '頻道' : '群'}廣播：${content}`
        : content;


    const formatKey = getFormatKey();

    return (
      <>
        <div className={`${styles['header']} ${isEventInChannel ? styles['event'] : ''}`}>
          {getHeaderElements()}
        </div>
        <div className={styles['messageBox']}>
          {messageContents.map((content, index) => (
            <div key={index}>
              <MarkdownViewer markdownText={lang.getTranslatedMessage(getContentWithType(content), formatKey)} />
            </div>
          ))}
        </div>
      </>
    );
  },
);

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
