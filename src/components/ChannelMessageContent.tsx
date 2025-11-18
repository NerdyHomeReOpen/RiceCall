import React, { useState, useEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, ChannelMessage, PromptMessage, Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

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
  // Hooks
  const { t } = useTranslation();

  // Refs
  const messageViewerRef = useRef<HTMLDivElement>(null);

  // States
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Heandles
  const handleScroll = () => {
    const el = messageViewerRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
    setIsAtBottom(isBottom);
  };

  const handleScrollToBottom = () => {
    const el = messageViewerRef.current;
    if (!el) return;

    setIsAtBottom(true);
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Effects
  useEffect(() => {
    if (messageGroups.length === 0) return;

    const lastMessage = messageGroups[messageGroups.length - 1];
    const el = messageViewerRef.current;
    const isBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight <= 100 : true;

    if (lastMessage.type !== 'general' || lastMessage.userId === user.userId) {
      setTimeout(() => handleScrollToBottom(), 50);
    } else if (isBottom) {
      setTimeout(() => handleScrollToBottom(), 50);
    } else {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messageGroups, user.userId]);

  useEffect(() => {
    if (isAtBottom) {
      setUnreadCount(0);
    }
  }, [isAtBottom]);

  return (
    <>
      <div ref={messageViewerRef} className={styles['message-viewer-wrapper']} onScroll={() => handleScroll()}>
        {messageGroups.map((messageGroup, index) => (
          <div key={index} className={styles['message-wrapper']}>
            {messageGroup.type === 'general' ? (
              <ChannelMessageTab messageGroup={messageGroup} user={user} channel={channel} server={server} />
            ) : (
              <PromptMessageTab messageGroup={messageGroup} messageType={messageGroup.type} />
            )}
          </div>
        ))}
      </div>
      {!isAtBottom && unreadCount > 0 && (
        <div className={styles['new-message-alert']} onClick={() => handleScrollToBottom()}>
          {t('has-new-message', { 0: unreadCount })}
        </div>
      )}
    </>
  );
});

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
