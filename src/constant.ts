import { LanguageKey, User } from '@/types';

export type RecommendServerCategory = {
  id: string;
  label: string[];
  tags: string[];
  emoji?: string;
  subCategories?: RecommendServerCategory[];
};

export const FONT_LIST = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: '微軟正黑體', value: '"Microsoft JhengHei", sans-serif' },
  { label: '微軟雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: 'PingFang TC', value: '"PingFang TC", sans-serif' },
  { label: 'Noto Sans TC', value: '"Noto Sans TC", sans-serif' },
];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const SHAKE_COOLDOWN = 3;
export const MAX_INPUT_LENGTH = 1000;
export const MAX_BROADCAST_LENGTH = 300;
export const ALLOWED_MESSAGE_KEYS = ['guest-send-an-external-link', 'message:send-shake-window', 'message:receive-shake-window'];
export const CATEGORIES: RecommendServerCategory[] = [
  {
    id: 'official-groups',
    label: ['official-groups'],
    tags: ['official'],
    emoji: '2705',
  },
  {
    id: 'taiwan-groups',
    label: ['taiwan-groups'],
    tags: ['taiwan'],
    emoji: '1f1f9-1f1fc',
    subCategories: [
      {
        id: 'taiwan-official-groups',
        label: ['taiwan-groups', 'official-groups'],
        tags: ['taiwan', 'official'],
      },
      {
        id: 'taiwan-entertainment-groups',
        label: ['taiwan-groups', 'entertainment-groups'],
        tags: ['taiwan', 'entertainment'],
      },
    ],
  },
  {
    id: 'russia-groups',
    label: ['russia-groups'],
    tags: ['russia'],
    emoji: '1f1f7-1f1fa',
    subCategories: [
      {
        id: 'russia-official-groups',
        label: ['russia-groups', 'official-groups'],
        tags: ['russia', 'official'],
      },
      {
        id: 'russia-entertainment-groups',
        label: ['russia-groups', 'entertainment-groups'],
        tags: ['russia', 'entertainment'],
      },
    ],
  },
  {
    id: 'brazil-groups',
    label: ['brazil-groups'],
    tags: ['brazil'],
    emoji: '1f1e7-1f1f7',
    subCategories: [
      {
        id: 'brazil-official-groups',
        label: ['brazil-groups', 'official-groups'],
        tags: ['brazil', 'official'],
      },
      {
        id: 'brazil-entertainment-groups',
        label: ['brazil-groups', 'entertainment-groups'],
        tags: ['brazil', 'entertainment'],
      },
    ],
  },
  {
    id: 'turkey-groups',
    label: ['turkey-groups'],
    tags: ['turkey'],
    emoji: '1f1f9-1f1f7',
    subCategories: [
      {
        id: 'turkey-official-groups',
        label: ['turkey-groups', 'official-groups'],
        tags: ['turkey', 'official'],
      },
      {
        id: 'turkey-entertainment-groups',
        label: ['turkey-groups', 'entertainment-groups'],
        tags: ['turkey', 'entertainment'],
      },
    ],
  },
  {
    id: 'iran-groups',
    label: ['iran-groups'],
    tags: ['iran'],
    emoji: '1f1ee-1f1f7',
    subCategories: [
      {
        id: 'iran-official-groups',
        label: ['iran-groups', 'official-groups'],
        tags: ['iran', 'official'],
      },
      {
        id: 'iran-entertainment-groups',
        label: ['iran-groups', 'entertainment-groups'],
        tags: ['iran', 'entertainment'],
      },
    ],
  },
];
export const STATUS_OPTIONS: User['status'][] = ['online', 'dnd', 'idle', 'gn'];
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
export const LANGUAGES: { code: LanguageKey; label: string }[] = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fa-IR', label: 'فارسی' },
  { code: 'tr-TR', label: 'Türkçe' },
];
export const ANNOUNCEMENT_SLIDE_INTERVAL = 8000; // 8 seconds
export const SHOW_FRAME_ORIGIN = 'https://show.ricecall.com';
export const REFRESH_REGION_INFO_INTERVAL = 1000 * 60 * 10; // 10 minutes
export const MESSAGE_VIERER_DEVIATION = 100;
