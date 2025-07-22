/* eslint-disable @typescript-eslint/no-explicit-any */

export type LanguageKey = 'en' | 'ru' | 'ja' | 'pt-BR' | 'zh-TW' | 'zh-CN';

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
        supportedLngs: ['en', 'ru', 'ja', 'pt-BR', 'zh-TW', 'zh-CN', ''],

        ns: ['translation', 'message', 'rpc'],
        defaultNS: 'translation',

        interpolation: { escapeValue: false },
      });
  } else {
    i18next.use(initReactI18next).init({
      lng: 'zh-TW',
      fallbackLng: 'zh-TW',

      ns: ['translation', 'message', 'rpc'],
      defaultNS: 'translation',

      resources: {
        'zh-TW': { translation: zhTW, message: zhTW_message, rpc: zhTW_rpc },
      },

      interpolation: { escapeValue: false },
    });
  }
})();

export default i18next;
