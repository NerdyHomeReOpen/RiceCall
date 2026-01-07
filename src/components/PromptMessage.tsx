import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import * as TagConverter from '@/utils/tagConverter';
import * as Language from '@/utils/language';

import styles from '@/styles/message.module.css';

interface PromptMessageProps {
  messageGroup: Types.PromptMessage & { contents: string[] };
  messageType?: Types.PromptMessage['type'];
}

const PromptMessage: React.FC<PromptMessageProps> = React.memo(({ messageGroup, messageType = 'info' }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { contents: messageContents, parameter: messageParameter } = messageGroup;
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

  return (
    <div className={`${styles['message-box']} ${styles['event']}`}>
      <div className={styles[`${messageType}-icon`]} />
      {formattedMessagesContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

PromptMessage.displayName = 'PromptMessage';

export default PromptMessage;
