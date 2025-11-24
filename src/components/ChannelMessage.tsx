import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, ChannelMessage, Server, Channel } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Utils
import { isServerAdmin } from '@/utils/permission';
import { handleOpenDirectMessage, handleOpenUserInfo, handleOpenBlockMember } from '@/utils/popup';
import { getFormatTimestamp } from '@/utils/language';

// Constants
import { ALLOWED_MESSAGE_KEYS } from '@/constant';

interface ChannelMessageProps {
  user: User;
  currentChannel: Channel;
  currentServer: Server;
  messageGroup: ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ user, currentChannel, currentServer, messageGroup }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { serverId: currentServerId } = currentServer;
  const {
    userId: senderUserId,
    name: senderName,
    nickname: senderNickname,
    vip: senderVip,
    gender: senderGender,
    permissionLevel: senderPermissionLevel,
    contents: messageContents,
    timestamp: messageTimestamp,
  } = messageGroup;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isUser = senderUserId === userId;
  const isSuperior = permissionLevel > senderPermissionLevel;
  const formattedTimestamp = getFormatTimestamp(t, messageTimestamp);
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

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'direct-message',
      label: t('direct-message'),
      show: !isUser,
      onClick: () => handleOpenDirectMessage(userId, senderUserId),
    },
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => handleOpenUserInfo(userId, senderUserId),
    },
    {
      id: 'separator',
      label: '',
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
    },
    {
      id: 'block',
      label: t('block'),
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
      onClick: () => handleOpenBlockMember(senderUserId, currentServerId),
    },
  ];

  return (
    <div className={styles['message-box']}>
      <div
        className={`${styles['header']}`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
        }}
      >
        <div className={`${senderPermissionLevel > 2 && permission[senderGender]} ${senderPermissionLevel > 2 && permission[`lv-${senderPermissionLevel}`]}`} />
        {senderVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
        <div className={`${styles['username-text']} ${senderVip > 0 ? `${vip['vip-name-color']}` : ''}`} onClick={() => handleOpenUserInfo(userId, senderUserId)}>
          {senderNickname || senderName}
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
