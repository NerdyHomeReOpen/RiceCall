import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, ChannelMessage } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { getFormatTimestamp } from '@/utils/language';

interface ChannelMessageProps {
  messageGroup: ChannelMessage & { contents: string[] };
  userId: User['userId'];
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup, userId }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Destructuring
  const { userId: senderUserId, name: senderName, vip: senderVip, gender: senderGender, permissionLevel: senderPermissionLevel, contents: messageContents, timestamp: messageTimestamp } = messageGroup;

  // Memos
  const formattedTimestamp = useMemo(() => getFormatTimestamp(t, messageTimestamp), [t, messageTimestamp]);
  const formattedMessageContents = useMemo(
    () =>
      messageContents.map((content) => {
        return content
          .split(' ')
          .map((msg) => (msg === 'guest-send-an-external-link' ? t('guest-send-an-external-link') : msg))
          .join(' ');
      }),
    [messageContents, t],
  );
  const isUser = useMemo(() => senderUserId === userId, [senderUserId, userId]);

  // handles
  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  return (
    <>
      <div className={`${permission[senderGender]} ${permission[`lv-${senderPermissionLevel}`]}`} />
      <div className={styles['message-box']}>
        <div className={styles['header']}>
          {senderVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
          <div
            className={`${styles['username-text']} ${senderVip > 0 ? `${vip['vip-name-color']}` : ''}`}
            onClick={() => handleOpenUserInfo(userId, senderUserId)}
            onContextMenu={(e) => {
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
              ]);
            }}
          >
            {senderName}
          </div>
          <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
        </div>
        {formattedMessageContents.map((content, index) => (
          <MarkdownContent key={index} markdownText={content} />
        ))}
      </div>
    </>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
