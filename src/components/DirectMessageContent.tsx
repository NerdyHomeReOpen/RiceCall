import React, { useLayoutEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, DirectMessage, PromptMessage } from '@/types';

// Components
import DirectMessageTab from '@/components/DirectMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup = (DirectMessage & { contents: string[] }) | (PromptMessage & { contents: string[] });

interface DirectMessageContentProps {
  messages: (DirectMessage | PromptMessage)[];
  user: User;
  isScrollToBottom?: boolean;
}

const DirectMessageContent: React.FC<DirectMessageContentProps> = React.memo(({ messages, isScrollToBottom = true }) => {
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

  // Effects
  useLayoutEffect(() => {
    if (isScrollToBottom && messagesViewerRef.current?.lastElementChild) {
      (messagesViewerRef.current.lastElementChild as HTMLElement).scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }
  }, [messageGroups, isScrollToBottom]);

  return (
    <div ref={messagesViewerRef} className={styles['message-viewer-wrapper']}>
      {messageGroups.map((messageGroup, index) => (
        <div key={index} className={styles['message-wrapper']}>
          {messageGroup.type === 'dm' ? <DirectMessageTab messageGroup={messageGroup} /> : <PromptMessageTab messageGroup={messageGroup} messageType={messageGroup.type} />}
        </div>
      ))}
    </div>
  );
});

DirectMessageContent.displayName = 'DirectMessageContent';

export default DirectMessageContent;
