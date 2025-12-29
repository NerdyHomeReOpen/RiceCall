import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import { useContextMenu } from '@/providers/ContextMenu';

import * as TagConverter from '@/utils/tagConverter';
import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/message.module.css';

interface PromptMessageProps {
  messageGroup: Types.PromptMessage & { contents: string[] };
  messageType?: Types.PromptMessage['type'];
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Variables
  const { userId } = user;
  const { contents: messageContents, parameter: messageParameter, contentMetadata: messageContentMetadata } = messageGroup;
  const { targetId: senderUserId } = messageContentMetadata;
  const escapedMessageParameter = Object.fromEntries(Object.entries(messageParameter).map(([key, value]) => [key, TagConverter.escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) =>
            c.startsWith('message:') ? t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: Language.getPermissionText(t, parseInt(messageParameter.userPermissionLevel)) } }) : c,
          )
          .join(' '),
      ),
    [messageContents, escapedMessageParameter, messageParameter, t],
  );

  // Handlers
  const getMessageContextMenuItems = () => new CtxMenuBuilder().addViewProfileOption(() => Popup.openUserInfo(userId, senderUserId)).build();

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getMessageContextMenuItems());
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
