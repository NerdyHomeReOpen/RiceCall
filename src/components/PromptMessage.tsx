import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import { useContextMenu } from '@/providers/ContextMenu';

import * as TagConverter from '@/utils/tagConverter';
import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';

import styles from '@/styles/message.module.css';

interface PromptMessageProps {
  user: Types.User;
  messageGroup: Types.PromptMessage & { contents: string[] };
  messageType?: Types.PromptMessage['type'];
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ user, messageGroup, messageType = 'info' }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { contents: messageContents, parameter: messageParameter, contentMetadata: messageContentNetadata } = messageGroup;
  const { targetId: senderUserId } = messageContentNetadata;
  const escapedMessageParameter = Object.fromEntries(Object.entries(messageParameter).map(([key, value]) => [key, TagConverter.escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: Language.getPermissionText(t, parseInt(messageParameter.userPermissionLevel)) } }))
          .join(' '),
      ),
    [messageContents, escapedMessageParameter, messageParameter, t],
  );

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => Popup.handleOpenUserInfo(userId, senderUserId),
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
