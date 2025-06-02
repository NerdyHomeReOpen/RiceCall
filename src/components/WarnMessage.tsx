import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { WarnMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface WarnMessageProps {
  messageGroup: WarnMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const WarnMessage: React.FC<WarnMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
    } = messageGroup;

    const { nickname: senderNickname = null, name: senderName } =
      messageSender ?? {};

    const { nickname: targetNickname = null, name: targetName } =
      messageReceiver ?? {};

    const formatKey = {
      user: targetNickname || targetName,
      operator: senderNickname || senderName,
    };

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content, formatKey),
    );

    return (
      <>
        <div className={styles['header']}>
          <div className={styles['warnIcon']} />
        </div>
        <div className={styles['messageBox']}>
          {formatMessages.map((content, index) => (
            <div key={index}>
              <MarkdownViewer markdownText={content} />
            </div>
          ))}
        </div>
      </>
    );
  },
);

WarnMessage.displayName = 'WarnMessage';

export default WarnMessage;
