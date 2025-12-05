import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, ChannelMessage, PromptMessage, Channel, Server } from '@/types';

// Components
import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup = (ChannelMessage & { contents: string[] }) | (PromptMessage & { contents: string[] });

interface ChannelMessageContentProps {
  user: User;
  currentServer: Server;
  currentChannel: Channel;
  messages: (ChannelMessage | PromptMessage)[];
}

const ChannelMessageContent: React.FC<ChannelMessageContentProps> = React.memo(({ user, currentServer, currentChannel, messages }) => {
  // Variables
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

  return (
    <div className={styles['message-viewer-wrapper']}>
      {messageGroups.map((messageGroup, index) => (
        <div key={index} className={styles['message-wrapper']}>
          {messageGroup.type === 'general' ? (
            <ChannelMessageTab user={user} currentServer={currentServer} currentChannel={currentChannel} messageGroup={messageGroup} />
          ) : (
            <PromptMessageTab user={user} messageType={messageGroup.type} messageGroup={messageGroup} />
          )}
        </div>
      ))}
      <div style={{ minHeight: '10px' }}></div>
    </div>
  );
});

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
