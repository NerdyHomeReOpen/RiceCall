/* eslint-disable @typescript-eslint/no-explicit-any */

export type LanguageKey = 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'fa' | 'pt-BR' | 'ru' | 'es-ES';

import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW/translation.json';
import zhTW_message from './locales/zh-TW/message.json';
import zhTW_rpc from './locales/zh-TW/rpc.json';

const hash = process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH!;

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
        supportedLngs: ['zh-TW', 'zh-CN', 'en', 'ja', 'fa', 'pt-BR', 'ru', 'es-ES'],

        ns: ['translation', 'rpc', 'message'],
        defaultNS: 'translation',

        interpolation: { escapeValue: false },
      });
  } else {
    i18next.use(initReactI18next).init({
      lng: 'zh-TW',
      fallbackLng: 'zh-TW',

      ns: ['translation', 'rpc', 'message'],
      defaultNS: 'translation',

      resources: {
        'zh-TW': { translation: zhTW, rpc: zhTW_rpc, message: zhTW_message },
      },

      interpolation: { escapeValue: false },
    });
  }
})();

export default i18next;
