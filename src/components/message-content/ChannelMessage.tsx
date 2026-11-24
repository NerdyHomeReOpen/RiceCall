import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import { openUserInfo } from '@/services';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';
import { useMessageCtxMenu } from '@/hooks/context-menus/useMessageCtxMenu';

import MarkdownContent from '@/components/markdown-content';

import { getFormatTimestamp } from '@/utils/language';

interface ChannelMessageProps {
  messageGroup: Types.ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
      lobbyId: state.currentServer.data.lobbyId,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      categoryId: state.currentChannel.data.categoryId,
    }),
    shallowEqual,
  );

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

  const { buildContextMenu: buildMessageContextMenu } = useMessageCtxMenu({
    user,
    currentServer,
    currentChannel,
    member: messageGroup,
  });

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildMessageContextMenu());
  };

  const handleUsernameClick = () => {
    openUserInfo(messageGroup.userId);
  };

  return (
    <div className="flex flex-col gap-[3px] items-start justify-start min-w-0">
      <div className="flex flex-row gap-[3px] items-center overflow-hidden" onContextMenu={handleMessageContextMenu}>
        {messageGroup.permissionLevel >= Permission.ChannelMod && <div className={`permission-${messageGroup.gender} permission-lv-${messageGroup.permissionLevel}`} />}
        {hasVip && <div className={`vip-icon vip-${messageGroup.vip}`} />}
        <div
          className={`overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer select-text hover:underline ${hasVip ? 'text-text-vip-name hover:text-text-vip-name-hover' : 'text-text-username'}`}
          onClick={handleUsernameClick}
        >
          {messageGroup.nickname || messageGroup.name}
        </div>
        <div className="min-w-fit ml-[5px] text-text-color-quinary select-text">{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
