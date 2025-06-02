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
    content = content.replace(
      'upgradeServerManagerMessage',
      '{gender}已被提升為本群的管理員。',
    );
    content = content.replace(
      'upgradeChannelManagerMessage',
      '{gender}已被提升為本頻道的管理員。',
    );
    content = content.replace(
      'upgradeMemberMessage',
      '{gender}已加入成為本群會員。',
    );
    content = content.replace(
      'timeoutMemberMessage',
      '【{user}】被管理員【{operator}】踢出群',
    );
    content = content.replace(
      'blockedMemberMessage',
      '【{user}】被管理員【{operator}】封鎖',
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
