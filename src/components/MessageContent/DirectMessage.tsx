import React from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openUserInfo } from '@/services';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/MarkdownContent';

import { getFormatTimestamp } from '@/utils/language';

import styles from './MessageContent.module.css';

interface DirectMessageProps {
  messageGroup: Types.DirectMessage & { contents: string[] };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ messageGroup }) => {
  const { t } = useTranslation();

  const userId = useAppSelector((state) => state.user.data.userId);

  const hasVip = messageGroup.vip > 0;
  const formattedTimestamp = getFormatTimestamp(messageGroup.timestamp);
  const formattedMessageContents = messageGroup.contents.map((content) =>
    content
      .split(' ')
      .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
      .join(' '),
  );

  const handleUsernameClick = () => {
    openUserInfo(userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={styles['details']}>
        <div className={`${styles['username-text']} ${hasVip ? styles['vip'] : ''}`} onClick={handleUsernameClick}>
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
