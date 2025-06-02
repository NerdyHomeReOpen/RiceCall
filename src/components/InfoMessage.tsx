import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { InfoMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface InfoMessageProps {
  messageGroup: InfoMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const InfoMessage: React.FC<InfoMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const { receiver: messageReceiver, contents: messageContents } =
      messageGroup;

    const { gender: receiverGender } = messageReceiver ?? {};

    const formatKey = {
      gender: receiverGender == 'Male' ? '你' : '妳',
    };

    const formatMessages = messageContents.map((content) =>
      lang.getTranslatedMessage(content, formatKey),
    );

    return (
      <>
        <div className={styles['header']}>
          <div className={styles['infoIcon']} />
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

InfoMessage.displayName = 'InfoMessage';

export default InfoMessage;
