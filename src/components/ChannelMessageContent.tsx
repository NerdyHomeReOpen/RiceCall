import React, { useState, useEffect, useMemo } from 'react';

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
  handleScrollToBottom?: () => void;
  isAtBottom?: boolean;
}

const ChannelMessageContent: React.FC<ChannelMessageContentProps> = React.memo(({ messages, user, channel, server, handleScrollToBottom, isAtBottom }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Effects
  useEffect(() => {
    const el = document.querySelector('[data-message-area]');
    if (!el) return;

    if (messageGroups.length === 0) return;

    const lastMessage = messageGroups[messageGroups.length - 1];
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;

    if (lastMessage.type !== 'general' || lastMessage.userId === user.userId) {
      setTimeout(() => handleScrollToBottom?.(), 50);
    } else if (isBottom) {
      setTimeout(() => handleScrollToBottom?.(), 50);
    } else {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messageGroups, user.userId, handleScrollToBottom]);

  useEffect(() => {
    if (isAtBottom) setUnreadCount(0);
  }, [isAtBottom]);

  return (
    <>
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
      </div>
      {unreadCount > 0 && (
        <div className={styles['new-message-alert']} onClick={() => handleScrollToBottom?.()}>
          {t('has-new-message', { 0: unreadCount })}
        </div>
      )}
    </>
  );
});

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
