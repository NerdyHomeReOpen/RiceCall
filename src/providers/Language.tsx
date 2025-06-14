import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
import { Translation, LanguageKey, Permission } from '@/types';

// Translation
import { translations } from '@/translation';

interface LanguageContextType {
  key: LanguageKey;
  tr: Translation;
  set: (lang: LanguageKey) => void;
  getPermissionText: (permission: Permission) => string;
  getFormatTimeDiff: (timestamp: number) => string;
  getFormatTimestamp: (timestamp: number) => string;
  getTranslatedMessage: (
    content: string,
    params?: Record<string, string> | undefined,
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<LanguageKey>('tw');
  const translation = translations[language];

  const getPermissionText = (permission: number): string => {
    const permissionMap: Record<number, string> = {
      [Permission.Guest]: translation.guest, // 1
      [Permission.Member]: translation.member, // 2
      [Permission.ChannelAdmin]: translation.channelAdmin, // 3
      [Permission.ChannelManager]: translation.channelManager, // 4
      [Permission.ServerAdmin]: translation.serverAdmin, // 5
      [Permission.ServerOwner]: translation.serverOwner, // 6
      [Permission.Official]: translation.official, // 7
      [Permission.EventStaff]: translation.eventStaff, // 8
    };
    return permissionMap[permission] || translation.unknownUser;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem('language') as LanguageKey;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const getFormatTimeDiff = (timestamp: number): string => {
    const now = Date.now();
    const diff = Math.floor((timestamp - now) / 1000);
    const isFuture = diff > 0;
    const absDiff = Math.abs(diff);

    const intervals = [
      { label: '年', seconds: 31536000 },
      { label: '個月', seconds: 2592000 },
      { label: '周', seconds: 604800 },
      { label: '天', seconds: 86400 },
      { label: '小時', seconds: 3600 },
      { label: '分鐘', seconds: 60 },
      { label: '秒', seconds: 1 },
    ];

    if (absDiff > 10) {
      for (const interval of intervals) {
        const count = Math.floor(absDiff / interval.seconds);
        if (count >= 1) {
          const label = interval.label;
          const timesAgo = '{0}前';
          const timesFuture = '{0}後'
          return isFuture
            ? timesFuture.replace('{0}', `${count}${label}`)
            : timesAgo.replace('{0}', `${count}${label}`)
        }
      }
    }

    return '剛剛';
  }

  const getFormatTimestamp = (timestamp: number): string => {
    const langMap: Record<LanguageKey, string> = {
      tw: 'zh-TW',
      cn: 'zh-CN',
      en: 'en-US',
      jp: 'ja-JP',
    };
    const timezoneLang = langMap[language] || 'zh-TW';
    const now = new Date();
    const messageDate = new Date(timestamp);
    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    const seconds = messageDate.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    if (messageDay.getTime() === today.getTime()) {
      return timeString;
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `${translation.yesterday} ${timeString}`;
    }
    return `${messageDate.toLocaleDateString(timezoneLang)} ${timeString}`;
  };

  const getTranslatedMessage = (
    content: string,
    params?: Record<string, string> | undefined,
  ) => {
    if (content.includes(' ')) {
      const [key, ...params] = content.split(' ');
      if (Object.prototype.hasOwnProperty.call(translation, key)) {
        let translatedText = translation[key as keyof typeof translation];
        params.forEach((param, index) => {
          translatedText = translatedText.replace(`{${index}}`, param);
        });
        content = translatedText;
      }

    } else {
      content = Object.prototype.hasOwnProperty.call(translation, content)
        ? translation[content as keyof typeof translation]
        : content;
    }

    // Action Event Messages

    content = content.replace(
      'removeFromMemberMessage',
      '移除了你的會員身分。',
    );
    content = content.replace(
      'removeFromChannelManagerMessage',
      '移除了你的頻道管理員身分。',
    );
    content = content.replace(
      'removeFromServerManagerMessage',
      '移除了你的群管理員身分。',
    );

    content = content.replace(
      'upgradeServerManagerMessage',
      '您已被提升為本群的管理員。',
    );
    content = content.replace(
      'upgradeChannelManagerMessage',
      '您已被提升為本頻道的管理員。',
    );
    content = content.replace(
      'upgradeMemberMessage',
      '您已加入成為本群會員。',
    );

    // Action Warn Messages

    content = content.replace(
      'forbidVoiceMessage',
      '您被管理員【{operator}】禁止語音',
    );
    content = content.replace(
      'unForbidVoiceMessage',
      '您被管理員【{operator}】重新開啟語音',
    );
    content = content.replace(
      'forbidTextMessage',
      '您被管理員【{operator}】禁止傳送文字訊息',
    );
    content = content.replace(
      'unForbidTextMessage',
      '您被管理員【{operator}】重新開啟傳送文字訊息',
    );
    content = content.replace(
      'timeoutChannelMessage',
      '您在【{channel}】頻道被管理員【{operator}】踢出 {time} 分鐘',
    );

    // Channel Event Messages

    content = content.replace(
      'setMemberMessage',
      '加入了群，成為本群會員。',
    );
    content = content.replace(
      'setChannelManagerMessage',
      '被提升為本頻道的頻道管理員。',
    );
    content = content.replace(
      'setServerManagerMessage',
      '被提升為本群的管理員。',
    );

    // Channel Warn Messages

    content = content.replace(
      'forbidVoiceMemberMessage',
      '【{target}】被管理員【{operator}】禁止語音',
    );
    content = content.replace(
      'unForbidVoiceMemberMessage',
      '【{target}】被管理員【{operator}】重新開啟語音',
    );
    content = content.replace(
      'forbidTextMemberMessage',
      '【{target}】被管理員【{operator}】禁止傳送文字訊息',
    );
    content = content.replace(
      'unForbidTextMemberMessage',
      '【{target}】被管理員【{operator}】重新開啟傳送文字訊息',
    );
    content = content.replace(
      'timeoutMemberChannelMessage',
      '【{target}】被管理員【{operator}】踢出頻道',
    );
    content = content.replace(
      'timeoutMemberMessage',
      '【{target}】被管理員【{operator}】踢出群',
    );
    content = content.replace(
      'blockedMemberMessage',
      '【{target}】被管理員【{operator}】封鎖',
    );
    content = content.replace(
      /{(\w+)}/gm,
      (match, p1) => params?.[p1] || match,
    );

    const isPlainText = !/[#>*\-\[\]`|!_~]/.test(content);
    return isPlainText ? content.replace(/\n/g, '<br />') : content;
  };

  return (
    <LanguageContext.Provider
      value={{
        tr: translation,
        key: language,
        set: setLanguage,
        getPermissionText,
        getFormatTimeDiff,
        getFormatTimestamp,
        getTranslatedMessage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.displayName = 'LanguageProvider';

export default LanguageProvider;
