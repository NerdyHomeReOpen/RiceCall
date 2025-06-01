import React, { useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/viewers/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Components
import MarkdownViewer from '@/components/viewers/Markdown';

// Types
import type {
  ChannelMessage,
  DirectMessage,
  InfoMessage,
  WarnMessage,
  EventMessage,
  AlertMessage,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

interface DirectMessageTabProps {
  messageGroup: DirectMessage & {
    contents: string[];
  };
}

const DirectMessageTab: React.FC<DirectMessageTabProps> = React.memo(
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

DirectMessageTab.displayName = 'DirectMessageTab';

interface ChannelMessageTabProps {
  messageGroup: ChannelMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const ChannelMessageTab: React.FC<ChannelMessageTabProps> = React.memo(
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

ChannelMessageTab.displayName = 'ChannelMessageTab';

interface InfoMessageTabProps {
  messageGroup: InfoMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const InfoMessageTab: React.FC<InfoMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents,
    } = messageGroup;

    const { gender: receiverGender } = messageReceiver ?? {};

    const formatKey = {
      gender: (receiverGender == 'Male' ? '你' : '妳'),
    };

    const format = (
      template: string,
      values: Record<string, string>,
    ): string => {
      let result = template;
      for (const key in values) {
        result = result.replace(`{${key}}`, values[key]);
      }
      return result;
    };

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }

      // TODO: lang.tr
      content = content.replace(
        'upgradeServerManagerMessage',
        '{gender}已被提升為本群的管理員。',
      );
      content = content.replace(
        'upgradeChannelManagerMessage',
        '{gender}已被提升為本頻道的管理員。',
      );
      content = content.replace(
        'upgradeChannelManagerMessage',
        '{gender}已加入成為本群會員。',
      );

      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['infoIcon']} />
        <div className={styles['messageBox']}>
          {messageContents.map((content, index) => (
            <div key={index}>
              <MarkdownViewer markdownText={format(getTranslatedContent(content), formatKey)} />
            </div>
          ))}
        </div>
      </>
    );
  },
);

InfoMessageTab.displayName = 'InfoMessageTab';

interface WarnMessageTabProps {
  messageGroup: WarnMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const WarnMessageTab: React.FC<WarnMessageTabProps> = React.memo(
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

    const format = (
      template: string,
      values: Record<string, string>,
    ): string => {
      let result = template;
      for (const key in values) {
        result = result.replace(`{${key}}`, values[key]);
      }
      return result;
    };

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      // TODO: lang.tr
      content = content.replace(
        'timeoutMemberMessage',
        '【{user}】被管理員【{operator}】踢出群',
      );
      content = content.replace(
        'blockedMemberMessage',
        '【{user}】被管理員【{operator}】封鎖',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['warnIcon']} />
        <div className={styles['messageBox']}>
          {messageContents.map((content, index) => (
            <div key={index}>
              <MarkdownViewer
                markdownText={format(getTranslatedContent(content), formatKey)}
              />
            </div>
          ))}
        </div>
      </>
    );
  },
);

WarnMessageTab.displayName = 'WarnMessageTab';

interface EventMessageTabProps {
  messageGroup: EventMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const EventMessageTab: React.FC<EventMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      receiver: messageReceiver,
      contents: messageContents
    } = messageGroup;

    const {
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageReceiver ?? {};

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      // TODO: lang.tr
      content = content.replace(
        'updateMemberMessage',
        '加入了群，成為本群會員。',
      );
      content = content.replace(
        'updateChannelManagerMessage',
        '被提升為本頻道的頻道管理員。',
      );
      content = content.replace(
        'updateServerManagerMessage',
        '被提升為本群的管理員。',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageEvent']}>
          <div className={styles['infoIcon']} />
          <div
            className={`
            ${styles['senderIcon']}
            ${permission[targetGender]}
            ${permission[`lv-${targetPermissionLevel}`]}
          `}
          />
          <div className={styles['username']}>
            {targetNickname || targetName}
          </div>
          <div className={styles['messageBox']}>
            {messageContents.map((content, index) => (
              <div key={index}>
                <MarkdownViewer markdownText={getTranslatedContent(content)} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

EventMessageTab.displayName = 'EventMessageTab';

const EventActionMessageTab: React.FC<EventMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      receiver: messageReceiver,
      contents: messageContents
    } = messageGroup;

    const {
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageSender ?? {};

    const { gender: receiverGender } = messageReceiver ?? {};

    const formatKey = {
      gender: (receiverGender == 'Male' ? '你' : '妳'),
    };

    const format = (
      template: string,
      values: Record<string, string>,
    ): string => {
      let result = template;
      for (const key in values) {
        result = result.replace(`{${key}}`, values[key]);
      }
      return result;
    };

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      // TODO: lang.tr
      content = content.replace(
        'removeFromMemberMessage',
        '移除了{gender}的會員身分。',
      );
      content = content.replace(
        'removeFromChannelManagerMessage',
        '移除了{gender}的頻道管理員身分。',
      );
      content = content.replace(
        'removeFromServerManagerMessage',
        '移除了{gender}的群管理員身分。',
      );
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageActionEvent']}>
          <div className={styles['infoIcon']} />
          <div
            className={`
            ${styles['senderIcon']}
            ${permission[targetGender]}
            ${permission[`lv-${targetPermissionLevel}`]}
          `}
          />
          <div className={styles['username']}>
            {targetNickname || targetName}
          </div>
          <div className={styles['messageBox']}>
            {messageContents.map((content, index) => (
              <div key={index}>
                <MarkdownViewer markdownText={format(getTranslatedContent(content), formatKey)} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

EventActionMessageTab.displayName = 'EventActionMessageTab';

interface AlertMessageTabProps {
  messageGroup: AlertMessage & {
    contents: string[];
  };
  forbidGuestUrl?: boolean;
}

const AlertMessageTab: React.FC<AlertMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      sender: messageSender,
      contents: messageContents,
      channelId: messageChannelId = null
    } = messageGroup;

    const {
      nickname: targetNickname = null,
      gender: targetGender,
      permissionLevel: targetPermissionLevel,
      name: targetName,
    } = messageSender ?? {};

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['messageActionEvent']}>
          <div className={styles['alertIcon']} />
          <div
            className={`
            ${styles['senderIcon']}
            ${permission[targetGender]}
            ${permission[`lv-${targetPermissionLevel}`]}
          `}
          />
          <div className={styles['username']}>
            {targetNickname || targetName}
          </div>
          <div className={styles['messageBox']}>
            {messageContents.map((content, index) => (
              <div key={index}>
                <MarkdownViewer markdownText={`${messageChannelId !== null ? '頻道廣播：': '群廣播：'}${getTranslatedContent(content)}`} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

AlertMessageTab.displayName = 'AlertMessageTab';

type MessageGroup = (
  | DirectMessage
  | ChannelMessage
  | InfoMessage
  | WarnMessage
  | EventMessage
  | AlertMessage
) & {
  /*
    ChannelMessage: 'general' | 'info' | 'warn' | 'event'
    DirectMessage: 'dm'
    ActionMessage: 'alert' | 'info' | 'warn' | 'event'
  */
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  contents: string[];
};

interface MessageViewerProps {
  messages:
    | DirectMessage[]
    | ChannelMessage[]
    | InfoMessage[]
    | WarnMessage[]
    | EventMessage[]
    | AlertMessage[];
  forbidGuestUrl?: boolean;
  isActionMessage?: boolean;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(
  ({ messages, forbidGuestUrl = false , isActionMessage = false}) => {
    // Variables
    const sortedMessages = [...messages].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const messageGroups = sortedMessages.reduce<MessageGroup[]>(
      (acc, message) => {
        const lastGroup = acc[acc.length - 1];
        const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
        const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
        const sameType = lastGroup && message.type === lastGroup.type;
        const isInfo = message.type === 'info';
        const isAlert = message.type === 'alert';
        const isGeneral = message.type === 'general';
        const isWarn = message.type === 'warn';
        const isEvent = message.type === 'event';
        const isDm = message.type === 'dm';
        const sameSender =
          lastGroup &&
          !isInfo &&
          !isWarn &&
          !isEvent &&
          !isAlert &&
          ((isGeneral &&
            lastGroup.type === 'general' &&
            message.sender.userId === lastGroup.sender.userId) ||
            (isDm &&
              lastGroup.type === 'dm' &&
              message.senderId === lastGroup.senderId));

        if (sameSender && nearTime && sameType && !isInfo) {
          lastGroup.contents.push(message.content);
        } else {
          acc.push({
            ...message,
            contents: [message.content],
          });
        }
        return acc;
      },
      [],
    );

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effects
    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [messageGroups]);

    return (
      <div className={styles['messageViewerWrapper']}>
        {messageGroups.map((messageGroup, index) => {
          return (
            <div key={index} className={styles['messageWrapper']}>
              {messageGroup.type === 'info' ? (
                <InfoMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'warn' ? (
                <WarnMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'event' && isActionMessage ? (
                <EventActionMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'alert' && isActionMessage ? (
                <AlertMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'event' ? (
                <EventMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'general' ? (
                <ChannelMessageTab
                  messageGroup={messageGroup}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'dm' ? (
                <DirectMessageTab messageGroup={messageGroup} />
              ) : null}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;
