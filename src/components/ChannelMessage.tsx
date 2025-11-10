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

interface ChannelMessageProps {
  messageGroup: ChannelMessage & { contents: string[] };
  user: User;
  channel: Channel;
  server: Server;
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup, user, channel, server }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Destructuring
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

  const { userId, permissionLevel: globalPermission } = user;

  const { permissionLevel: channelPermissionLevel } = channel;
  const { serverId, permissionLevel: serverPermissionLevel } = server;

  // Variables
  const permissionLevel = Math.max(globalPermission, serverPermissionLevel, channelPermissionLevel);
  const isUser = useMemo(() => senderUserId === userId, [senderUserId, userId]);
  const isSuperior = permissionLevel > senderPermissionLevel;

  // Memos
  const ALLOWED_MESSAGE_KEYS = useMemo(() => ['guest-send-an-external-link'], []);
  const formattedTimestamp = useMemo(() => getFormatTimestamp(t, messageTimestamp), [t, messageTimestamp]);
  const formattedMessageContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageContents, t, ALLOWED_MESSAGE_KEYS],
  );

  return (
    <div className={styles['message-box']}>
      <div
        className={styles['header']}
        onClick={() => handleOpenUserInfo(userId, senderUserId)}
        onContextMenu={(e) => {
          e.stopPropagation();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
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
              onClick: () => handleOpenBlockMember(senderUserId, serverId),
            },
          ]);
        }}
      >
        <div className={`${senderPermissionLevel > 2 && permission[senderGender]} ${senderPermissionLevel > 2 && permission[`lv-${senderPermissionLevel}`]}`} />
        {senderVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
        <div className={`${styles['username-text']} ${senderVip > 0 ? `${vip['vip-name-color']}` : ''}`}>{senderNickname || senderName}</div>
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
