import React, { useLayoutEffect, useMemo, useRef } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { User, ChannelMessage, PromptMessage, Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import ChannelMessageTab from '@/components/ChannelMessage';
import PromptMessageTab from '@/components/PromptMessage';

type MessageGroup = (ChannelMessage & { contents: string[] }) | (PromptMessage & { contents: string[] });

interface ChannelMessageContentProps {
  messages: (ChannelMessage | PromptMessage)[];
  user: User;
  channel: Channel;
  server: Server;
  onClearMessages?: () => void;
}

const ChannelMessageContent: React.FC<ChannelMessageContentProps> = React.memo(
  ({ messages, user, channel, server, onClearMessages }) => {
    const contextMenu = useContextMenu();
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messageGroups = useMemo(() => {
      const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
      return sortedMessages.reduce<MessageGroup[]>((acc, message) => {
        const lastGroup = acc[acc.length - 1];
        const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
        const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
        const sameType = lastGroup && message.type === lastGroup.type;
        const isGeneral = message.type === 'general';
        const sameSender =
          lastGroup && lastGroup.type === 'general' && message.type === 'general' && message.userId === lastGroup.userId;

        if (sameSender && nearTime && sameType && isGeneral) {
          lastGroup.contents.push(message.content);
        } else {
          acc.push({ ...message, contents: [message.content] });
        }
        return acc;
      }, []);
    }, [messages]);

    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, [messageGroups]);

    return (
      <div
        className={styles['message-viewer-wrapper']}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          if (target.closest(`.${styles['username-text']}`)) return;
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'clean-up-message',
              label: t('clean-up-message'),
              onClick: () => {
                localStorage.setItem('c', '1');
                onClearMessages?.();
              },
            },
          ]);
        }}
      >
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
  }
);

ChannelMessageContent.displayName = 'ChannelMessageContent';

export default ChannelMessageContent;
