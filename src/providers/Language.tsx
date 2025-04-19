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

  return (
    <LanguageContext.Provider
      value={{
        tr: translation,
        key: language,
        set: setLanguage,
        getPermissionText,
        getFormatTimestamp,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.displayName = 'LanguageProvider';

export default LanguageProvider;
