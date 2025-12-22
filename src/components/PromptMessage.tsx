import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { PromptMessage, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Utils
import { escapeHtml } from '@/utils/tagConverter';
import { getPermissionText } from '@/utils/language';
import { handleOpenUserInfo } from '@/utils/popup';

interface PromptMessageProps {
  user: User;
  messageGroup: PromptMessage & {
    contents: string[];
  };
  messageType?: string;
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ user, messageGroup, messageType = 'info' }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { contents: messageContents, parameter: messageParameter, contentMetadata: messageContentNetadata } = messageGroup;
  const { targetId: senderUserId } = messageContentNetadata;
  const escapedMessageParameter = Object.fromEntries(Object.entries(messageParameter).map(([key, value]) => [key, escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: getPermissionText(t, parseInt(messageParameter.userPermissionLevel)) } }))
          .join(' '),
      ),
    [messageContents, escapedMessageParameter, messageParameter, t],
  );

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => handleOpenUserInfo(userId, senderUserId),
    },
  ];

  return (
    <div
      className={`${styles['message-box']} ${styles['event']}`}
      onContextMenu={(e) => {
        if (!senderUserId) return;
        e.preventDefault();
        e.stopPropagation();
        const { clientX: x, clientY: y } = e;
        contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
      }}
    >
      <div className={styles[`${messageType}-icon`]} />
      {formattedMessagesContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
