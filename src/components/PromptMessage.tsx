import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
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
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  // Variables
  const escapedMessageParameter = Object.fromEntries(Object.entries(messageGroup.parameter).map(([key, value]) => [key, TagConverter.escapeHtml(value)]));
  const formattedMessagesContents = useMemo(
    () =>
      messageGroup.contents.map((content) =>
        content
          .split(' ')
          .map((c) =>
            c.startsWith('message:')
              ? t(c, { ns: 'message', ...{ ...escapedMessageParameter, permissionText: Language.getPermissionText(t, parseInt(messageGroup.parameter.userPermissionLevel)) } })
              : c,
          )
          .join(' '),
      ),
    [messageGroup.contents, escapedMessageParameter, messageGroup.parameter, t],
  );

  // Functions
  const getMessageContextMenuItems = () =>
    messageGroup.contentMetadata && messageGroup.contentMetadata.userId
      ? new CtxMenuBuilder().addViewProfileOption(() => Popup.openUserInfo(user.userId, messageGroup.contentMetadata.userId)).build()
      : [];

  // Handlers
  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!messageGroup.contentMetadata) return;
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
