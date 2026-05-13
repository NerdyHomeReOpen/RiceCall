import { t } from '@/i18n';

import { Permission } from '@/types';

/**
 * Get the translated text for a permission level
 * @param permission - The permission level
 * @returns The translated text for the permission level
 */
export function getPermissionText(permission: Permission): string {
  const permissionMap: Record<Permission, string> = {
    [Permission.Guest]: t('guest'),
    [Permission.Member]: t('member'),
    [Permission.ChannelMod]: t('channel-mod'),
    [Permission.ChannelAdmin]: t('channel-admin'),
    [Permission.ServerAdmin]: t('server-admin'),
    [Permission.ServerOwner]: t('server-owner'),
    [Permission.Staff]: t('staff'),
    [Permission.SuperAdmin]: t('super-admin'),
  };
  return permissionMap[permission] || t('unknown-user');
}

/**
 * Get the formatted time difference
 * @param timestamp - The timestamp
 * @returns The formatted time difference
 */
export function getFormatTimeDiff(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((timestamp - now) / 1000);
  const isFuture = diff > 0;
  const absDiff = Math.abs(diff);

  const intervals = [
    { tKey: 'years', seconds: 31536000 },
    { tKey: 'months', seconds: 2592000 },
    { tKey: 'weeks', seconds: 604800 },
    { tKey: 'days', seconds: 86400 },
    { tKey: 'hours', seconds: 3600 },
    { tKey: 'minutes', seconds: 60 },
    { tKey: 'seconds', seconds: 1 },
  ];

  if (absDiff > 10) {
    for (const interval of intervals) {
      const count = Math.floor(absDiff / interval.seconds);
      if (count >= 1) {
        const tKey = `${interval.tKey}-${isFuture ? 'later' : 'ago'}`;
        return t(tKey, { 0: count.toString() });
      }
    }
  }

  return t('just-now');
}

/**
 * Get the formatted date
 * @param timestamp - The timestamp
 * @param type - The type of date to format
 * @returns The formatted date
 */
export function getFormatDate(timestamp: number, type: string = 'd' as 'd' | 't' | 'all'): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  switch (type) {
    case 'd':
      return `${year}-${month}-${day}`;
    case 't':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

/**
 * Get the formatted time from seconds
 * @param seconds - The seconds
 * @returns The formatted time
 */
export function getFormatTimeFromSecond(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Get the formatted timestamp
 * @param timestamp - The timestamp
 * @returns The formatted timestamp
 */
export function getFormatTimestamp(timestamp: number): string {
  const timezoneLang = navigator.language;
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
}
