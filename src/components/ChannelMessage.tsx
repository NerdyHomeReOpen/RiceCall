import React from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { ChannelMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface ChannelMessageProps {
  messageGroup: ChannelMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(
  ({ messageGroup, forbidGuestUrl = false }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      contents: messageContents,
      timestamp: messageTimestamp,
    } = messageGroup;

    const {
      gender: senderGender,
      name: senderName,
      vip: senderVip,
      nickname: senderNickname,
      permissionLevel: messagePermission,
    } = messageSender;

    const timestamp = lang.getFormatTimestamp(messageTimestamp);

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content),
    );

    return (
      <>
        <div
          className={`${styles['gradeIcon']} ${permission[senderGender]} ${
            permission[`lv-${messagePermission}`]
          }`}
        />
        <div className={styles['messageBox']}>
          <div className={styles['header']}>
            {senderVip > 0 && (
              <div
                className={`${vip['vipIcon']} ${vip[`vip-small-${senderVip}`]}`}
              ></div>
            )}
            <div className={styles['username']}>
              {senderNickname || senderName}
            </div>
            <div className={styles['timestamp']}>{timestamp}</div>
          </div>
          {formatMessages.map((content, index) => (
            <div key={index} className={styles['content']}>
              <MarkdownViewer
                markdownText={content}
                forbidGuestUrl={forbidGuestUrl}
              />
            </div>
          ))}
        </div>
      </>
    );
  },
);

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
