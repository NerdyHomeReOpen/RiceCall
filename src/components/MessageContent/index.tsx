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
      const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
      const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
      const sameType = lastGroup && message.type === lastGroup.type;
      const isPromptMessage = message.type === 'info' || message.type === 'warn' || message.type === 'event' || message.type === 'alert';

      const isSameSender = () => {
        if (message.type === 'general' && lastGroup?.type === 'general') {
          return message.userId === lastGroup.userId;
        }
        if (message.type === 'dm' && lastGroup?.type === 'dm') {
          return message.user1Id === lastGroup.user1Id && message.user2Id === lastGroup.user2Id;
        }
        return false;
      };

      if (isSameSender() && nearTime && sameType && !isPromptMessage) {
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
