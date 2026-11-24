import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { openUserInfo } from '@/services';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import MarkdownContent from '@/components/markdown-content';

import { getFormatTimestamp } from '@/utils/language';

interface DirectMessageProps {
  messageGroup: Types.DirectMessage & { contents: string[] };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(({ messageGroup }) => {
  const { t } = useTranslation();

  const hasVip = messageGroup.vip > 0;
  const formattedTimestamp = getFormatTimestamp(messageGroup.timestamp);
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

  const handleUsernameClick = () => {
    openUserInfo(messageGroup.userId);
  };

  return (
    <div className="flex flex-col gap-[3px] items-start justify-start min-w-0">
      <div className="flex flex-row gap-[3px] items-center overflow-hidden">
        <div
          className={`overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer select-text hover:underline ${hasVip ? 'text-text-vip-name hover:text-text-vip-name-hover' : 'text-text-username'}`}
          onClick={handleUsernameClick}
        >
          {messageGroup.name}
        </div>
        <div className="min-w-fit ml-[5px] text-text-color-quinary select-text">{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
