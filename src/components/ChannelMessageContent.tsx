import React, { useMemo } from 'react';

import type * as Types from '@/types';

import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';

import styles from '@/styles/message.module.css';

type MessageGroup = (Types.ChannelMessage & { contents: string[] }) | (Types.PromptMessage & { contents: string[] });

interface ChannelMessageContentProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  messages: (Types.ChannelMessage | Types.PromptMessage)[];
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
      {messageGroups.map((messageGroup, index) =>
        messageGroup.type === 'general' ? (
          <ChannelMessageTab key={index} user={user} currentServer={currentServer} currentChannel={currentChannel} messageGroup={messageGroup} />
        ) : (
          <PromptMessageTab key={index} user={user} messageType={messageGroup.type} messageGroup={messageGroup} />
        ),
      )}
    </div>
  );
});

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
