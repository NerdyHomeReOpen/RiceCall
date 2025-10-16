import React, { useLayoutEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, ChannelMessage, PromptMessage, Channel, Server } from '@/types';

// Components
import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup = (ChannelMessage & { contents: string[] }) | (PromptMessage & { contents: string[] });

interface ChannelMessageContentProps {
  messages: (ChannelMessage | PromptMessage)[];
  user: User;
  channel: Channel;
  server: Server;
}

const ChannelMessageContent: React.FC<ChannelMessageContentProps> = React.memo(({ messages, user, channel, server }) => {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memos
  const messageGroups = useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    return sortedMessages.reduce<MessageGroup[]>((acc, message) => {
      const lastGroup = acc[acc.length - 1];
      const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
      const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
      const sameType = lastGroup && message.type === lastGroup.type;
      const isGeneral = message.type === 'general';
      const sameSender = lastGroup && lastGroup.type === 'general' && message.type === 'general' && message.userId === lastGroup.userId;

      if (sameSender && nearTime && sameType && isGeneral) {
        lastGroup.contents.push(message.content);
      } else {
        acc.push({ ...message, contents: [message.content] });
      }
      return acc;
    }, []);
  }, [messages]);

  // Effects
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messageGroups]);

  return (
    <div className={styles['message-viewer-wrapper']}>
      {messageGroups.map((messageGroup, index) => (
        <div key={index} className={styles['message-wrapper']}>
          {messageGroup.type === 'general' ? (
            <ChannelMessageTab messageGroup={messageGroup} user={user} channel={channel} server={server} />
          ) : (
            <PromptMessageTab messageGroup={messageGroup} messageType={messageGroup.type} />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
