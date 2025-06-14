import React, { useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { ChannelMessage, DirectMessage, PromptMessage } from '@/types';

// Components
import DirectMessageTab from '@/components/DirectMessage';
import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup =
  | (DirectMessage & { contents: string[] })
  | (ChannelMessage & { contents: string[] })
  | (PromptMessage & { contents: string[] });

interface MessageViewerProps {
  messages: (DirectMessage | ChannelMessage | PromptMessage)[];
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
        const isGeneral = message.type === 'general';
        const isDm = message.type === 'dm';
        const sameSender =
          lastGroup &&
          ((lastGroup.type === 'general' &&
            message.type === 'general' &&
            message.userId === lastGroup.userId) ||
            (lastGroup.type === 'dm' &&
              message.type === 'dm' &&
              message.userId === lastGroup.userId));

        if (sameSender && nearTime && sameType && (isGeneral || isDm)) {
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
                  messageType={messageGroup.type}
                  isActionMessage={isActionMessage}
                />
              )}
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
