import type * as Types from '@/types';

export const SYSTEM_FONT_LIST = ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans TC', 'Microsoft JhengHei', 'Heiti TC', 'LiHei Pro', 'sans-serif'];
export const FONT_LIST = [
  // Recommended Fonts
  {
    label: 'System Default',
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", "LiHei Pro", sans-serif',
  },

  // Sans-serif Fonts - Suitable for UI and titles
  {
    label: 'Arial',
    value: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  },
  {
    label: 'Verdana',
    value: 'Verdana, Geneva, Tahoma, sans-serif',
  },
  {
    label: 'Tahoma',
    value: 'Tahoma, Verdana, Geneva, sans-serif',
  },
  {
    label: 'Trebuchet MS',
    value: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", sans-serif',
  },
  {
    label: 'Impact',
    value: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  },
  {
    label: 'Segoe UI',
    value: '"Segoe UI", Frutiger, "Frutiger Linotype", "Dejavu Sans", "Helvetica Neue", Arial, sans-serif',
  },
  {
    label: 'Roboto',
    value: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Serif Fonts - Suitable for reading articles
  {
    label: 'Times New Roman',
    value: '"Times New Roman", Times, serif',
  },
  {
    label: 'Georgia',
    value: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    label: 'Garamond',
    value: '"EB Garamond", Garamond, "Palatino Linotype", "Book Antiqua", Palatino, serif',
  },
  {
    label: 'Palatino',
    value: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  },

  // Monospace Fonts - Suitable for code
  {
    label: 'Consolas',
    value: 'Consolas, "Andale Mono", "Lucida Console", "Liberation Mono", Monaco, monospace',
  },
  {
    label: 'Courier New',
    value: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace',
  },
  {
    label: 'Monaco',
    value: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
  },

  // Traditional Chinese Fonts
  {
    label: '微軟正黑體 (Microsoft JhengHei)',
    value: '"Microsoft JhengHei", "Heiti TC", sans-serif',
  },
  {
    label: '新細明體 (PMingLiU)',
    value: '"PMingLiU", "LiSong Pro", "Songti TC", serif',
  },
  {
    label: '標楷體 (KaiTi)',
    value: '"KaiTi", "BiauKai", "DFKai-SB", serif',
  },
];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const SHAKE_COOLDOWN = 3 * 1000;
export const MAX_INPUT_LENGTH = 1000;
export const MAX_BROADCAST_LENGTH = 300;
export const ALLOWED_MESSAGE_KEYS = ['guest-send-an-external-link', 'message:send-shake-window', 'message:receive-shake-window'];
export const STATUS_OPTIONS: Types.User['status'][] = ['online', 'dnd', 'idle', 'gn'];
export const MEMBER_MANAGEMENT_TABLE_FIELDS: { tKey: string; key: string; minWidth: number }[] = [
  {
    tKey: 'name',
    key: 'name',
    minWidth: 150,
  },
  {
    tKey: 'permission',
    key: 'permissionLevel',
    minWidth: 120,
  },
  {
    tKey: 'contribution',
    key: 'contribution',
    minWidth: 70,
  },
  {
    tKey: 'join-date',
    key: 'joinAt',
    minWidth: 100,
  },
];
export const MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS: { tKey: string; key: string; minWidth: number }[] = [
  {
    tKey: 'name',
    key: 'name',
    minWidth: 150,
  },
  {
    tKey: 'description',
    key: 'description',
    minWidth: 200,
  },
  {
    tKey: 'create-at',
    key: 'createdAt',
    minWidth: 90,
  },
];
export const BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS: { tKey: string; key: string; minWidth: number }[] = [
  {
    tKey: 'name',
    key: 'name',
    minWidth: 220,
  },
  {
    tKey: 'unblock-date',
    key: 'isBlocked',
    minWidth: 220,
  },
];
export const RECOMMEND_SERVER_CATEGORY_TABS = [
  { key: 'all', tKey: 'all' },
  { key: 'radio', tKey: 'radio' },
  { key: 'entertainment', tKey: 'entertainment' },
  { key: 'sing', tKey: 'sing' },
  { key: 'game', tKey: 'game' },
  { key: 'community', tKey: 'community' },
];
export const LANGUAGES: { code: Types.LanguageKey; label: string }[] = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fa-IR', label: 'فارسی' },
  { code: 'tr-TR', label: 'Türkçe' },
];
export const REGIONS: { code: Types.RegionKey; label: string }[] = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
];
export const ANNOUNCEMENT_SLIDE_INTERVAL = 8000; // 8 seconds
export const INVITATION_BASE_URL = 'https://ricecall.com/join';
export const SHOW_FRAME_ORIGIN = 'https://show.ricecall.com';
export const REFRESH_REGION_INFO_INTERVAL = 1000 * 60 * 10; // 10 minutes
export const MESSAGE_VIERER_DEVIATION = 100;
export const SERVER_OPTIONS: { tKey: string; value: 'prod' | 'dev' }[] = [
  { tKey: 'prod-server', value: 'prod' },
  { tKey: 'test-server', value: 'dev' },
];
export const KICK_TIME_FORMAT_OPTIONS = [
  { tKey: 'second', value: 'seconds' },
  { tKey: 'minute', value: 'minutes' },
  { tKey: 'hour', value: 'hours' },
  { tKey: 'day', value: 'days' },
  { tKey: 'month', value: 'month' },
  { tKey: 'year', value: 'years' },
];
export const KICK_REASON_OPTIONS = [
  { tKey: 'reason-spam', value: 'spam' },
  { tKey: 'reason-abuse', value: 'abuse' },
  { tKey: 'reason-harassment', value: 'harassment' },
  { tKey: 'reason-inappropriate-content', value: 'inappropriate-content' },
  { tKey: 'reason-other', value: 'other' },
];
export const KICK_REASON_OTHER_MAX_LENGTH = 20;
export const SERVER_TYPES: { tKey: string; value: Types.Server['type'] }[] = [
  { tKey: 'game', value: 'game' },
  { tKey: 'entertainment', value: 'entertainment' },
  { tKey: 'other', value: 'other' },
];

export * from './emojis';
