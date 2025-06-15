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
      name: senderName,
      vip: senderVip,
      gender: senderGender,
      permissionLevel: senderPermissionLevel,
      parameter: messageParameter,
      contents: messageContents,
      timestamp: messageTimestamp,
    } = messageGroup;

    const timestamp = lang.getFormatTimestamp(messageTimestamp);

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content, messageParameter),
    );

    return (
      <>
        <div
          className={`${styles['gradeIcon']} ${permission[senderGender]} ${
            permission[`lv-${senderPermissionLevel}`]
          }`}
        />
        <div className={styles['messageBox']}>
          <div className={styles['header']}>
            {senderVip > 0 && (
              <div
                className={`${vip['vipIcon']} ${vip[`vip-small-${senderVip}`]}`}
              />
            )}
            <div className={styles['username']}>{senderName}</div>
            <div className={styles['timestamp']}>{timestamp}</div>
          </div>
          {formatMessages.map((content, index) => (
            <MarkdownViewer
              key={index}
              markdownText={content}
              forbidGuestUrl={forbidGuestUrl}
            />
          ))}
        </div>
      </>
    );
  },
);

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;
