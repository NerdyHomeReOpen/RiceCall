import { TFunction } from 'i18next';
import i18n, { LanguageKey, LANGUAGES } from '@/i18n';

const FREE_IP_API_URL = 'https://ipinfo.io/json';

export const getPermissionText = (t: TFunction<'translation', undefined>, permission: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): string => {
  const permissionMap: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, string> = {
    1: t('guest'),
    2: t('member'),
    3: t('channel-mod'),
    4: t('channel-admin'),
    5: t('server-admin'),
    6: t('server-owner'),
    7: t('staff'),
    8: t('super-admin'),
  };
  return permissionMap[permission] || t('unknown-user');
};

export const getFormatTimeDiff = (t: TFunction<'translation', undefined>, timestamp: number): string => {
  const now = Date.now();
  const diff = Math.floor((timestamp - now) / 1000);
  const isFuture = diff > 0;
  const absDiff = Math.abs(diff);

  const intervals = [
    { label: t('year'), seconds: 31536000 },
    { label: t('month'), seconds: 2592000 },
    { label: t('week'), seconds: 604800 },
    { label: t('day'), seconds: 86400 },
    { label: t('hour'), seconds: 3600 },
    { label: t('minute'), seconds: 60 },
    { label: t('second'), seconds: 1 },
  ];

  if (absDiff > 10) {
    for (const interval of intervals) {
      const count = Math.floor(absDiff / interval.seconds);
      if (count >= 1) {
        const label = interval.label;
        const timesAgo = `${count}${label}${t('ago')}`;
        const timesFuture = `${count}${label}${t('future')}`;
        return isFuture ? timesFuture : timesAgo;
      }
    }
  }

  return t('just-now');
};

export const getFormatTimestamp = (t: TFunction<'translation', undefined>, timestamp: number): string => {
  const timezoneLang = i18n.language;
  const now = new Date();
  const messageDate = new Date(timestamp);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
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
    return `${t('yesterday')} ${timeString}`;
  }
  return `${messageDate.toLocaleDateString(timezoneLang)} ${timeString}`;
};

export const getLangByIp = async (): Promise<LanguageKey> => {
  const response = await fetch(`${FREE_IP_API_URL}/json`);
  if (!response.ok) return 'en';

  const data = await response.json();

  const lang: string | undefined = data.languages?.[0];
  if (!lang) return 'en';

  const match = LANGUAGES.find(({ code }) => code.includes(lang));
  if (!match) return 'en';

  return match.code;
};
