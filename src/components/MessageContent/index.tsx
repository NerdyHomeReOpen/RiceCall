import React, { useMemo } from 'react';

import type * as Types from '@/types';

import ChannelMessage from './ChannelMessage';
import DirectMessage from './DirectMessage';
import PromptMessage from './PromptMessage';

import styles from './MessageContent.module.css';

type MessageGroup = (Types.ChannelMessage | Types.DirectMessage | Types.PromptMessage) & { contents: string[] };

interface MessageContentProps {
  messages: (Types.ChannelMessage | Types.DirectMessage | Types.PromptMessage)[];
}

const MessageContent: React.FC<MessageContentProps> = React.memo(({ messages }) => {
  const messageGroups = useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    return sortedMessages.reduce<MessageGroup[]>((acc, message) => {
      const lastGroup = acc[acc.length - 1];
      const isNearTime = lastGroup && message.timestamp - lastGroup.timestamp <= 5 * 60 * 1000;
      const isSameType = lastGroup && message.type === lastGroup.type;
      const isPromptMessage = message.type === 'info' || message.type === 'warn' || message.type === 'event' || message.type === 'alert';
      const isSameSender = lastGroup && 'userId' in message && 'userId' in lastGroup && message.userId === lastGroup.userId;

      if (isSameSender && isNearTime && isSameType && !isPromptMessage) {
        lastGroup.contents.push(message.content);
      } else {
        acc.push({ ...message, contents: [message.content] });
      }
      return acc;
    }, []);
  }, [messages]);

  return (
    <div className={styles['message-content-wrapper']}>
      {messageGroups.map((messageGroup, index) => {
        switch (messageGroup.type) {
          case 'general':
            return <ChannelMessage key={index} messageGroup={messageGroup} />;
          case 'dm':
            return <DirectMessage key={index} messageGroup={messageGroup} />;
          case 'info':
          case 'warn':
          case 'event':
          case 'alert':
            return <PromptMessage key={index} messageGroup={messageGroup} messageType={messageGroup.type} />;
          default:
            return null;
        }
      })}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

export default MessageContent;
