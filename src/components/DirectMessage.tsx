import React from 'react';

// CSS
import styles from '@/styles/message.module.css';

// Types
import type { DirectMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface DirectMessageProps {
  messageGroup: DirectMessage & {
    contents: string[];
  };
}

const DirectMessage: React.FC<DirectMessageProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      name: senderName,
      contents: messageContents,
      timestamp: messageTimestamp,
    } = messageGroup;
    const timestamp = lang.getFormatTimestamp(messageTimestamp);

    const processContent = (content: string) => {
      const replaced = content.replace(
        /{{GUEST_SEND_AN_EXTERNAL_LINK}}/g,
        lang.tr.GUEST_SEND_AN_EXTERNAL_LINK,
      );
      // 判斷是否為純文字（沒有明顯 markdown 語法）
      const isPlainText = !/[#>*\-\[\]`|!_~]/.test(replaced);
      return isPlainText ? replaced.replace(/\n/g, '<br />') : replaced;
    };

    return (
      <div className={styles['messageBox']}>
        <div className={styles['header']}>
          <div className={styles['username']}>{senderName}</div>
          <div className={styles['timestamp']}>{timestamp}</div>
        </div>
        {messageContents.map((content, index) => (
          <div key={index} className={styles['content']}>
            <MarkdownViewer markdownText={processContent(content)} />
          </div>
        ))}
      </div>
    );
  },
);

DirectMessage.displayName = 'DirectMessage';

export default DirectMessage;
