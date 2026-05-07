import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import Logger from '@/utils/logger';

import Env from '@/utils/env';

import I18nStorage from '@/i18n/storage';

const I18N_VERSION_KEY = 'i18n_version';
const I18N_CACHE_PREFIX = 'i18n_cache:';

function cacheKey(lng: string, ns: string): string {
  return `${I18N_CACHE_PREFIX}${lng}:${ns}`;
}

function readCache(lng: string, ns: string): Record<string, unknown> | null {
  try {
    const raw = I18nStorage.get().getItem(cacheKey(lng, ns));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    I18nStorage.get().removeItem(cacheKey(lng, ns));
    return null;
  }
}

function writeCache(lng: string, ns: string, data: Record<string, unknown>): void {
  try {
    I18nStorage.get().setItem(cacheKey(lng, ns), JSON.stringify(data));
  } catch {
    new Logger('i18n').warn('storage write failed');
  }
}

function purgeCache(): void {
  const keysToRemove = I18nStorage.get()
    .keys()
    .filter((k) => k.startsWith(I18N_CACHE_PREFIX));
  keysToRemove.forEach((k) => I18nStorage.get().removeItem(k));
}

async function checkCacheVersion(): Promise<void> {
  const baseUrl = Env.get().DOCS_BASE_URL;
  if (!baseUrl) return;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = (await res.json()) as Record<string, unknown>;
    const remoteVersion = typeof manifest.version === 'string' ? manifest.version : null;

    if (!remoteVersion) {
      new Logger('i18n').warn('manifest.json missing version field, skipping cache invalidation');
      return;
    }

    const cachedVersion = I18nStorage.get().getItem(I18N_VERSION_KEY);
    if (cachedVersion !== remoteVersion) {
      purgeCache();
      I18nStorage.get().setItem(I18N_VERSION_KEY, remoteVersion);
    }
  } catch (e) {
    new Logger('i18n').warn(`manifest.json fetch failed, using existing cache: ${e}`);
  }
}

class HttpBackend {
  type = 'backend' as const;
  read(lng: string, ns: string, cb: (error: Error | null, data: Record<string, unknown> | null) => void) {
    const cached = readCache(lng, ns);
    if (cached) {
      cb(null, cached);
      return;
    }

    const baseUrl = Env.get().I18N_BASE_URL;
    if (!baseUrl) {
      cb(new Error('I18N_BASE_URL is not configured'), null);
      return;
    }

    fetch(`${baseUrl.replace(/\/$/, '')}/${lng}/${ns}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        writeCache(lng, ns, data);
        cb(null, data);
      })
      .catch((error: Error) => cb(error, null));
  }
}

export const i18nReady = I18nStorage.load()
  .then(() => checkCacheVersion())
  .then(() =>
    i18next
      .use(new HttpBackend())
      .use(initReactI18next)
      .init({
        lng: 'zh-TW',
        fallbackLng: 'zh-TW',
        supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

        ns: ['app', 'rpc', 'message', 'country', 'badge', 'position', 'system'],
        defaultNS: 'app',
        fallbackNS: ['app'],

        interpolation: { escapeValue: false },
        load: 'currentOnly' as const,
        nonExplicitSupportedLngs: false,
      }),
  );

export function t(key: string, params?: Record<string, string>) {
  return i18next.t(key, params);
}

export function changeLanguage(language: Types.LanguageKey) {
  i18next.changeLanguage(language);
}

export default i18next;
