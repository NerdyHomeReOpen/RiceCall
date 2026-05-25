import React from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openUserInfo } from '@/services';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';
import { useMessageCtxMenu } from '@/hooks/ContextMenus/useMessageCtxMenu';

import MarkdownContent from '@/components/MarkdownContent';

import { getFormatTimestamp } from '@/utils/language';

import styles from './MessageContent.module.css';

interface ChannelMessageProps {
  messageGroup: Types.ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const currentChannelCategoryId = useAppSelector((state) => state.currentChannel.data.categoryId);

  const hasVip = messageGroup.vip > 0;
  const formattedTimestamp = getFormatTimestamp(messageGroup.timestamp);
  const formattedMessageContents = messageGroup.contents.map((content) =>
    content
      .split(' ')
      .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
      .join(' '),
  );

  const { buildContextMenu: buildMessageContextMenu } = useMessageCtxMenu({
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    currentChannelCategoryId,
    memberUserId: messageGroup.userId,
    memberPermissionLevel: messageGroup.permissionLevel,
    memberName: messageGroup.nickname || messageGroup.name,
    memberCurrentChannelId: messageGroup.currentChannelId,
  });

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildMessageContextMenu());
  };

  const handleUsernameClick = () => {
    openUserInfo(userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={`${styles['details']}`} onContextMenu={handleMessageContextMenu}>
        {messageGroup.permissionLevel >= Types.Permission.ChannelMod && <div className={`permission-${messageGroup.gender} permission-lv-${messageGroup.permissionLevel}`} />}
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
