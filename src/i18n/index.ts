import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import Env from '@/env';

const getBaseUrl = () => Env.get().I18N_BASE_URL;

class HttpBackend {
  type = 'backend' as const;
  read(lng: string, ns: string, cb: (error: Error | null, data: Record<string, unknown> | null) => void) {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      cb(new Error('I18N_BASE_URL is not configured'), null);
      return;
    }
    fetch(`${baseUrl.replace(/\/$/, '')}/${lng}/${ns}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => cb(null, data))
      .catch((error: Error) => cb(error, null));
  }
}

export const i18nReady = i18next
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
  });

export function t(key: string, params?: Record<string, string>) {
  return i18next.t(key, params);
}

export function changeLanguage(language: Types.LanguageKey) {
  i18next.changeLanguage(language);
}

export default i18next;
