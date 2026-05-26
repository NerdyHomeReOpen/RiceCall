import React from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openUserInfo } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/MarkdownContent';

import ContextMenu from '@/utils/contextMenu';
import { escapeHtml, getPermissionText } from '@/utils';

import styles from './MessageContent.module.css';

interface PromptMessageProps {
  messageGroup: Types.PromptMessage & { contents: string[] };
  messageType?: Types.PromptMessage['type'];
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const userId = useAppSelector((state) => state.user.data.userId);

  const escapedMessageParameter = Object.fromEntries(Object.entries(messageGroup.parameter).map(([key, value]) => [key, escapeHtml(value)]));
  const formattedMessagesContents = messageGroup.contents.map((content) =>
    content
      .split(' ')
      .map((c) => (c.startsWith('message:') ? t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: getPermissionText(parseInt(messageGroup.parameter.userPermissionLevel)) } }) : c))
      .join(' '),
  );

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu =
      messageGroup.contentMetadata && messageGroup.contentMetadata.userId
        ? new ContextMenu().addViewProfileOption(() => openUserInfo(userId, messageGroup.contentMetadata.userId)).build()
        : new ContextMenu().build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  return (
    <div className={`${styles['message-box']} ${styles['event']}`} onContextMenu={handleMessageContextMenu}>
      <div className={styles[`${messageType}-icon`]} />
      {formattedMessagesContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
