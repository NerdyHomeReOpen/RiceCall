/* eslint-disable @typescript-eslint/no-explicit-any */
export type LanguageKey = 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'fa' | 'pt-BR' | 'ru' | 'es-ES' | 'tr';
export const LANGUAGES: { code: LanguageKey; label: string }[] = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fa', label: 'فارسی' },
  { code: 'tr', label: 'Türkçe' },
];

import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW/translation.json';
import zhTW_message from './locales/zh-TW/message.json';
import zhTW_rpc from './locales/zh-TW/rpc.json';
import zhTW_country from './locales/zh-TW/country.json';

// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Not in Electron environment:', error);
  }
}

const hash = ipcRenderer?.sendSync('get-env')?.CROWDIN_DISTRIBUTION_HASH || '';

/** OTA backend */
class CrowdinBackend {
  type = 'backend' as const;
  client = new otaClient(hash);
  read(lng: string, _ns: string, cb: any) {
    this.client
      .getStringsByLocale(lng)
      .then((data) => cb(null, data))
      .catch((err) => cb(err, null));
  }
}

(async () => {
  if (hash) {
    i18next
      .use(new CrowdinBackend())
      .use(initReactI18next)
      .init({
        lng: 'zh-TW',
        fallbackLng: 'zh-TW',
        supportedLngs: ['zh-TW', 'zh-CN', 'en', 'ja', 'fa', 'pt-BR', 'ru', 'es-ES', 'tr'],

        ns: ['translation', 'rpc', 'message', 'country'],
        defaultNS: 'translation',

        interpolation: { escapeValue: false },
      });
  } else {
    i18next.use(initReactI18next).init({
      lng: 'zh-TW',
      fallbackLng: 'zh-TW',

      ns: ['translation', 'rpc', 'message', 'country'],
      defaultNS: 'translation',

      resources: {
        'zh-TW': { translation: zhTW, rpc: zhTW_rpc, message: zhTW_message, country: zhTW_country },
      },

      interpolation: { escapeValue: false },
    });
  }
})();

export default i18next;
