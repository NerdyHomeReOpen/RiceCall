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

    const processContent = (content: string) => {
      const replaced = content.replace(
        /{{GUEST_SEND_AN_EXTERNAL_LINK}}/g,
        lang.tr.GUEST_SEND_AN_EXTERNAL_LINK,
      );
      const isPlainText = !/[#>*\-\[\]`|!_~]/.test(replaced);
      return isPlainText ? replaced.replace(/\n/g, '<br />') : replaced;
    };

    return (
      <>
        <div
          className={`${styles['senderIcon']} ${permission[senderGender]} ${
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
          {messageContents.map((content, index) => (
            <div key={index} className={styles['content']}>
              <MarkdownViewer
                markdownText={processContent(content)}
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
