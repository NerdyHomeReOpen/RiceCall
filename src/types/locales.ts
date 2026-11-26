// Copied from RiceCallEngineeringStandard/shared/locales.ts by scripts/sync-shared.mjs. Do not edit; change the source and run the script.
// Interface and mail locales, see docs/naming.md. Translations for each locale live in RiceCallStaticJson.

export const LOCALES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fa-IR', label: 'فارسی' },
  { code: 'tr-TR', label: 'Türkçe' },
] as const;

export type Locale = (typeof LOCALES)[number]['code'];

export const LOCALE_CODES: readonly Locale[] = LOCALES.map(({ code }) => code);
export const DEFAULT_LOCALE: Locale = 'zh-TW';

// The language part of a tag picks the locale; Chinese also needs its script or region.
const LOCALE_BY_LANGUAGE: Record<string, Locale> = { en: 'en-US', ru: 'ru-RU', pt: 'pt-BR', es: 'es-ES', fa: 'fa-IR', tr: 'tr-TR' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value);
}

// Maps a language tag such as 'en-GB', 'zh-Hant-HK' or 'pt' to a supported locale, or null. A bare 'zh' uses countryCode when given.
export function matchLocale(tag: string, countryCode?: string): Locale | null {
  const lower = tag.trim().toLowerCase();
  const exact = LOCALE_CODES.find((code) => code.toLowerCase() === lower);
  if (exact) return exact;
  const [language, ...rest] = lower.split(/[-_]/);

  if (language === 'zh') {
    const subtags = rest.length ? rest : [(countryCode ?? '').toLowerCase()];
    return subtags.some((subtag) => subtag === 'hans' || subtag === 'cn' || subtag === 'sg') ? 'zh-CN' : 'zh-TW';
  }

  return (language && LOCALE_BY_LANGUAGE[language]) || null;
}

export function pickLocale(tags: readonly string[], countryCode?: string): Locale {
  for (const tag of tags) {
    const locale = matchLocale(tag, countryCode);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => part.split(';')[0]?.trim() ?? '')
    .filter((tag) => tag !== '' && tag !== '*');
}
