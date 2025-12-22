import React, { useMemo, useRef } from 'react';

import type * as Types from '@/types';

import DirectMessageTab from '@/components/DirectMessage';
import PromptMessageTab from '@/components/PromptMessage';

import styles from '@/styles/message.module.css';

type MessageGroup = (Types.DirectMessage & { contents: string[] }) | (Types.PromptMessage & { contents: string[] });

interface DirectMessageContentProps {
  user: Types.User;
  messages: (Types.DirectMessage | Types.PromptMessage)[];
}

const DirectMessageContent: React.FC<DirectMessageContentProps> = React.memo(({ user, messages }) => {
  // Refs
  const messagesViewerRef = useRef<HTMLDivElement>(null);

  // Variables
  const messageGroups = useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    return sortedMessages.reduce<MessageGroup[]>((acc, message) => {
      const lastGroup = acc[acc.length - 1];
      const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
      const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
      const sameType = lastGroup && message.type === lastGroup.type;
      const isDm = message.type === 'dm';
      const sameSender = lastGroup && lastGroup.type === 'dm' && message.type === 'dm' && message.userId === lastGroup.userId;

      if (sameSender && nearTime && sameType && isDm) {
        lastGroup.contents.push(message.content);
      } else {
        acc.push({ ...message, contents: [message.content] });
      }
      return acc;
    }, []);
  }, [messages]);

  return (
    <div ref={messagesViewerRef} className={styles['message-viewer-wrapper']}>
      {messageGroups.map((messageGroup, index) => (
        <div key={index} className={styles['message-wrapper']}>
          {messageGroup.type === 'dm' ? <DirectMessageTab messageGroup={messageGroup} /> : <PromptMessageTab user={user} messageGroup={messageGroup} messageType={messageGroup.type} />}
        </div>
      ))}
    </div>
  );
});

DirectMessageContent.displayName = 'DirectMessageContent';

export default DirectMessageContent;
