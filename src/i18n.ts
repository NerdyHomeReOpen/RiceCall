/* eslint-disable @typescript-eslint/no-explicit-any */
import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const distributionHash = process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH;

const localBackend = new HttpBackend(null, {
  loadPath: '/locales/{{lng}}/translation.json',
});

export type LanguageKey = 'en' | 'ru' | 'ja' | 'pt-BR' | 'zh-TW' | 'zh-CN';

class CrowdinBackend {
  type = 'backend' as const;
  client: otaClient;

  constructor(options: { hash: string }) {
    this.client = new otaClient(options.hash);
  }

  read(lang: string, ns: string, cb: any) {
    this.client
      .getStringsByLocale(lang)
      .then((data) => cb(null, data)) // data => i18next JSON
      .catch((err) => cb(err, null));
  }
}

i18next
  .use(localBackend)
  .use(initReactI18next)
  .init({
    lng: 'zh-TW',
    fallbackLng: 'zh-TW',
    supportedLngs: ['en', 'ru', 'ja', 'pt-BR', 'zh-TW', 'zh-CN'],

    ns: ['translation'],
    defaultNS: 'translation',

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    interpolation: { escapeValue: false },
  });

export default i18next;
