import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';

import { ALLOWED_MESSAGE_KEYS } from '@/constant';

import styles from '@/styles/message.module.css';

interface DirectMessageProps {
  messageGroup: Types.DirectMessage & { contents: string[] };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ messageGroup }) => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  // Variables
  const formattedTimestamp = Language.getFormatTimestamp(t, messageGroup.timestamp);
  const formattedMessageContents = useMemo(
    () =>
      messageGroup.contents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageGroup.contents, t],
  );

  // Handlers
  const handleUsernameClick = () => {
    Popup.openUserInfo(user.userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={styles['details']}>
        <div className={styles['username-text']} onClick={handleUsernameClick}>
          {messageGroup.name}
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
