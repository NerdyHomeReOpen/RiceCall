import React from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Types
import { User, PopupType } from '@/types';
import type { ChannelMessage } from '@/types';

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
  const {
    userId: senderUserId,
    name: senderName,
    vip: senderVip,
    gender: senderGender,
    permissionLevel: senderPermissionLevel,
    contents: messageContents,
    timestamp: messageTimestamp,
  } = messageGroup;

  const isCurrentUser = senderUserId === userId;

  const formattedTimestamp = getFormatTimestamp(t, messageTimestamp);

  // handles
  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, {
      userId,
      targetId,
      targetName,
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, {
      userId,
      targetId,
    });
  };

  return (
    <>
      <div
        className={`${styles['gradeIcon']} ${permission[senderGender]} ${permission[`lv-${senderPermissionLevel}`]}`}
      />
      <div className={styles['messageBox']}>
        <div className={styles['header']}>
          {senderVip > 0 && <div className={`${vip['vipIcon']} ${vip[`vip-small-${senderVip}`]}`} />}
          <div
            className={`${styles['username']} ${senderVip > 0 ? `${vip['isVIP']} ${vip['clickable']}` : ''}`}
            onClick={() => handleOpenUserInfo(userId, senderUserId)}
            onContextMenu={(e) => {
              const x = e.clientX;
              const y = e.clientY;
              contextMenu.showContextMenu(x, y, false, false, [
                {
                  id: 'direct-message',
                  label: t('directMessage'),
                  show: !isCurrentUser,
                  onClick: () => handleOpenDirectMessage(userId, senderUserId, senderName),
                },
                {
                  id: 'view-profile',
                  label: t('viewProfile'),
                  onClick: () => handleOpenUserInfo(userId, senderUserId),
                },
              ]);
            }}
          >
            {senderName}
          </div>
          <div className={styles['timestamp']}>{formattedTimestamp}</div>
        </div>
        {messageContents.map((content, index) => (
          <MarkdownViewer key={index} markdownText={content} forbidGuestUrl={forbidGuestUrl} />
        ))}
      </div>
    </>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
