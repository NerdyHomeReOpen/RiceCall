import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, ChannelMessage, DirectMessage, PromptMessage } from '@/types';

// Components
import DirectMessageTab from '@/components/DirectMessage';
import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';
import { useContextMenu } from '@/providers/ContextMenu';
import { useTranslation } from 'react-i18next';

type MessageGroup = (DirectMessage & { contents: string[] }) | (ChannelMessage & { contents: string[] }) | (PromptMessage & { contents: string[] });

interface MessageViewerProps {
  messages: (DirectMessage | ChannelMessage | PromptMessage)[];
  userId: User['userId'];
  forbidGuestUrl?: boolean;
  onClear?: () => void;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(({ messages, userId, forbidGuestUrl = false, onClear }) => {
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Variables
  const messageGroups = useMemo(() => {
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    return sortedMessages.reduce<MessageGroup[]>((acc, message) => {
      const lastGroup = acc[acc.length - 1];
      const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
      const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
      const sameType = lastGroup && message.type === lastGroup.type;
      const isGeneral = message.type === 'general';
      const isDm = message.type === 'dm';
      const sameSender =
        lastGroup &&
        ((lastGroup.type === 'general' && message.type === 'general' && message.userId === lastGroup.userId) ||
          (lastGroup.type === 'dm' && message.type === 'dm' && message.userId === lastGroup.userId));

      if (sameSender && nearTime && sameType && (isGeneral || isDm)) {
        lastGroup.contents.push(message.content);
      } else {
        acc.push({ ...message, contents: [message.content] });
      }
      return acc;
    }, []);
  }, [messages]);

  // Effects
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
    });
  }, [messageGroups]);

  // Handlers
  const handleClearMessages = () => {
    if (onClear) onClear();
  };

  return (
    <div className={styles['message-viewer-wrapper']}  
          onContextMenu={(e) => {
              const x = e.clientX;
              const y = e.clientY;
              contextMenu.showContextMenu(x, y, false, false, [
                {
                  id: 'clear-all',
                  label: t('clear-all'),
                  show: true,
                  onClick: () => handleClearMessages(),
                }                
              ]);
            }}>
      {messageGroups.map((messageGroup, index) => {
        return (
          <div key={index} className={styles['message-wrapper']}>
            {messageGroup.type === 'general' ? (
              <ChannelMessageTab messageGroup={messageGroup} userId={userId} forbidGuestUrl={forbidGuestUrl} />
            ) : messageGroup.type === 'dm' ? (
              <DirectMessageTab messageGroup={messageGroup} />
            ) : (
              <PromptMessageTab messageGroup={messageGroup} messageType={messageGroup.type} />
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;
