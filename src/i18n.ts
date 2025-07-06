/* eslint-disable @typescript-eslint/no-explicit-any */
import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import ChainedBackend from 'i18next-chained-backend';
import { initReactI18next } from 'react-i18next';

export type LanguageKey = 'en' | 'ru' | 'ja' | 'pt-BR' | 'zh-TW' | 'zh-CN';

/** OTA backend */
class CrowdinBackend {
  type = 'backend' as const;
  client: otaClient | null = null;

  init(_services: any, options: { hash: string }) {
    if (!options.hash) throw new Error('Crowdin hash missing');
    this.client = new otaClient(options.hash);
  }

  read(lng: string, _ns: string, cb: any) {
    if (!this.client) throw new Error('Crowdin client not initialized');

    this.client
      .getStringsByLocale(lng)
      .then((data) => cb(null, data))
      .catch((err) => cb(err, null));
  }
}

i18next
  .use(ChainedBackend)
  .use(initReactI18next)
  .init({
    backend: {
      backends: [HttpBackend, CrowdinBackend],
      backendOptions: [
        { loadPath: '/locales/{{lng}}/{{ns}}.json' },
        { hash: process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH },
      ],
    },

    lng: 'zh-TW',
    fallbackLng: 'zh-TW',
    supportedLngs: ['en', 'ru', 'ja', 'pt-BR', 'zh-TW', 'zh-CN'],

    ns: ['translation', 'rpc', 'message'],
    defaultNS: 'translation',

    interpolation: { escapeValue: false },
  });

export default i18next;
