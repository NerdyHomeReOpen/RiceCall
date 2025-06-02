import React, { useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type {
  ChannelMessage,
  DirectMessage,
  InfoMessage,
  WarnMessage,
  EventMessage,
  AlertMessage,
  PromptMessage,
} from '@/types';

// Components
import DirectMessageTab from '@/components/DirectMessage';
import ChannelMessageTab from '@/components/ChannelMessage';
import InfoMessageTab from '@/components/InfoMessage';
import WarnMessageTab from '@/components/WarnMessage';
import EventMessageTab from '@/components/EventMessage';
import AlertMessageTab from '@/components/AlertMessage';
import ActionMessageTab from '@/components/ActionMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup = (
  | DirectMessage
  | ChannelMessage
  | InfoMessage
  | WarnMessage
  | EventMessage
  | AlertMessage
) & {
  /*
    ChannelMessage: 'general' | 'info' | 'warn' | 'event'
    DirectMessage: 'dm'
    ActionMessage: 'alert' | 'info' | 'warn' | 'event'
  */
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  contents: string[];
};

interface MessageViewerProps {
  messages:
  | DirectMessage[]
  | ChannelMessage[]
  | InfoMessage[]
  | WarnMessage[]
  | EventMessage[]
  | AlertMessage[];
  forbidGuestUrl?: boolean;
  isActionMessage?: boolean;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(
  ({ messages, forbidGuestUrl = false, isActionMessage = false }) => {
    // Variables
    const sortedMessages = [...messages].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const messageGroups = sortedMessages.reduce<MessageGroup[]>(
      (acc, message) => {
        const lastGroup = acc[acc.length - 1];
        const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
        const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
        const sameType = lastGroup && message.type === lastGroup.type;
        const isInfo = message.type === 'info';
        const isAlert = message.type === 'alert';
        const isGeneral = message.type === 'general';
        const isWarn = message.type === 'warn';
        const isEvent = message.type === 'event';
        const isDm = message.type === 'dm';
        const sameSender =
          lastGroup &&
          !isInfo &&
          !isWarn &&
          !isEvent &&
          !isAlert &&
          ((isGeneral &&
            lastGroup.type === 'general' &&
            message.sender.userId === lastGroup.sender.userId) ||
            (isDm &&
              lastGroup.type === 'dm' &&
              message.senderId === lastGroup.senderId));

        if (sameSender && nearTime && sameType && !isInfo) {
          lastGroup.contents.push(message.content);
        } else {
          acc.push({
            ...message,
            contents: [message.content],
          });
        }
        return acc;
      },
      [],
    );

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effects
    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [messageGroups]);

    return (
      <div className={styles['messageViewerWrapper']}>
        {messageGroups.map((messageGroup, index) => {
          return (
            <div key={index} className={styles['messageWrapper']}>
              {messageGroup.type === 'general' ? (
                <ChannelMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'dm' ? (
                <DirectMessageTab messageGroup={messageGroup} />
              ) : (
                <PromptMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                  messageType={messageGroup.type}
                  isActionMessage={isActionMessage}
                />
              )}
              {/* {messageGroup.type === 'info' ? (
                <InfoMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'warn' ? (
                <WarnMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'event' && isActionMessage ? (
                <ActionMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'alert' && isActionMessage ? (
                <AlertMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'event' ? (
                <EventMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'general' ? (
                <ChannelMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'dm' ? (
                <DirectMessageTab messageGroup={messageGroup} />
              ) : null} */}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;
