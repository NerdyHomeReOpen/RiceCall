import React from 'react';

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
import MarkdownViewer from '@/components/MarkdownViewer';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { getFormatTimestamp } from '@/utils/language';

interface ChannelMessageProps {
  messageGroup: ChannelMessage & {
    contents: string[];
  };
  userId: User['userId'];
  forbidGuestUrl?: boolean;
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup, userId, forbidGuestUrl = false }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId: senderUserId, name: senderName, vip: senderVip, gender: senderGender, permissionLevel: senderPermissionLevel, contents: messageContents, timestamp: messageTimestamp } = messageGroup;
  const isCurrentUser = senderUserId === userId;
  const formattedTimestamp = getFormatTimestamp(t, messageTimestamp);
  const formattedMessageContents = messageContents.map((content) => {
    return content
      .split(' ')
      .map((msg) => {
        if (msg === 'guest-send-an-external-link') return t('guest-send-an-external-link');
        return msg;
      })
      .join(' ');
  });

  // handles
  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
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
              const x = e.clientX;
              const y = e.clientY;
              contextMenu.showContextMenu(x, y, false, false, [
                {
                  id: 'direct-message',
                  label: t('direct-message'),
                  show: !isCurrentUser,
                  onClick: () => handleOpenDirectMessage(userId, senderUserId, senderName),
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
          <MarkdownViewer key={index} markdownText={content} forbidGuestUrl={forbidGuestUrl} />
        ))}
      </div>
    </>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
