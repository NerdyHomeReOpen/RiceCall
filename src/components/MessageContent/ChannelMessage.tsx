import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as Actions from '@/action';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';
import { useMessageContextMenu } from '@/hooks/ContextMenus/Message';

import MarkdownContent from '@/components/MarkdownContent';

import { getFormatTimestamp } from '@/utils/language';

import styles from './MessageContent.module.css';

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
  const formattedTimestamp = getFormatTimestamp(t, messageGroup.timestamp);
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

  const { buildContextMenu: buildMessageContextMenu } = useMessageContextMenu({
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
    Actions.openUserInfo(user.userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={`${styles['details']}`} onContextMenu={handleMessageContextMenu}>
        {messageGroup.permissionLevel >= Permission.ChannelMod && <div className={`permission-${messageGroup.gender} permission-lv-${messageGroup.permissionLevel}`} />}
        {hasVip && <div className={`vip-icon vip-${messageGroup.vip}`} />}
        <div className={`${styles['username-text']} ${hasVip ? styles['vip'] : ''}`} onClick={handleUsernameClick}>
          {messageGroup.nickname || messageGroup.name}
        </div>
        <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
