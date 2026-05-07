import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';
import { usePromptMessageContextMenu } from '@/hooks/ContextMenus/PromptMessage';

import MarkdownContent from '@/components/MarkdownContent';

import { escapeHtml } from '@/utils/tagConverter';
import { getPermissionText } from '@/utils/language';

import styles from './MessageContent.module.css';

interface PromptMessageProps {
  messageGroup: Types.PromptMessage & { contents: string[] };
  messageType?: Types.PromptMessage['type'];
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const user = useAppSelector((state) => ({ userId: state.user.data.userId }), shallowEqual);

  const escapedMessageParameter = Object.fromEntries(Object.entries(messageGroup.parameter).map(([key, value]) => [key, escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageGroup.contents.map((content) =>
        content
          .split(' ')
          .map((c) =>
            c.startsWith('message:') ? t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: getPermissionText(parseInt(messageGroup.parameter.userPermissionLevel)) } }) : c,
          )
          .join(' '),
      ),
    [messageGroup.contents, escapedMessageParameter, messageGroup.parameter, t],
  );

  const { buildContextMenu: buildMessageContextMenu } = usePromptMessageContextMenu({ user, contentMetadata: messageGroup.contentMetadata });

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildMessageContextMenu());
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
