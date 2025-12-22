import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';

import { ALLOWED_MESSAGE_KEYS } from '@/constant';

import styles from '@/styles/message.module.css';

interface DirectMessageProps {
  user: Types.User;
  messageGroup: Types.DirectMessage & { contents: string[] };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ user, messageGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { userId: senderUserId, name: senderName, contents: messageContents, timestamp: messageTimestamp } = messageGroup;
  const formattedTimestamp = Language.getFormatTimestamp(t, messageTimestamp);
  const formattedMessageContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageContents, t],
  );

  return (
    <div className={styles['message-box']}>
      <div className={styles['details']}>
        <div className={styles['username-text']} onClick={() => Popup.handleOpenUserInfo(userId, senderUserId)}>
          {senderName}
        </div>
        <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
