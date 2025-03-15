import { LanguageKey, Permission, Translation } from '@/types';

export const formatTimestamp = (
  timestamp: number,
  key: LanguageKey,
  tr: Translation,
): string => {
  const langMap: Record<LanguageKey, string> = {
    tw: 'zh-TW',
    cn: 'zh-CN',
    en: 'en-US',
    jp: 'ja-JP',
    ru: 'ru-RU',
  };
  const timezoneLang = langMap[key] || 'zh-TW';
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

  if (messageDay.getTime() === today.getTime()) {
    return messageDate.toLocaleTimeString(timezoneLang, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `${tr.yesterday} ${messageDate.toLocaleTimeString(timezoneLang, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return `${messageDate.toLocaleDateString(
    timezoneLang,
  )} ${messageDate.toLocaleTimeString(timezoneLang, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const getPermissionText = (
  permission: number,
  tr: Translation,
): string => {
  const permissionMap: Record<number, string> = {
    [Permission.Guest]: tr.guest, // 1
    [Permission.Member]: tr.member, // 2
    [Permission.ChannelAdmin]: tr.channelAdmin, // 3
    [Permission.ChannelManager]: tr.channelManager, // 4
    [Permission.ServerAdmin]: tr.serverAdmin, // 5
    [Permission.ServerOwner]: tr.serverOwner, // 6
    [Permission.EventStaff]: tr.eventStaff, // 7
    [Permission.Official]: tr.official, // 8
  };
  return permissionMap[permission] || tr.unknownUser;
};
