/* eslint-disable @typescript-eslint/no-explicit-any */

export type LanguageKey = 'en' | 'ru' | 'ja' | 'pt-BR' | 'zh-TW' | 'zh-CN';

/* Crowdin OTA */

import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

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

i18next
  .use(new CrowdinBackend())
  .use(initReactI18next)
  .init({
    lng: 'zh-TW',
    fallbackLng: 'zh-TW',
    supportedLngs: ['en', 'ru', 'ja', 'pt-BR', 'zh-TW', 'zh-CN'],

    ns: ['translation', 'rpc', 'message'],
    defaultNS: 'translation',

    interpolation: { escapeValue: false },
  });

/* Local I18n */

// import i18next from 'i18next';
// import HttpBackend from 'i18next-http-backend';
// import { initReactI18next } from 'react-i18next';

// i18next
//   .use(HttpBackend)
//   .use(initReactI18next)
//   .init({
//     backend: {
//       loadPath: '/locales/{{lng}}/{{ns}}.json',
//     },

//     lng: 'zh-TW',
//     fallbackLng: 'zh-TW',
//     supportedLngs: ['en', 'ru', 'ja', 'pt-BR', 'zh-TW', 'zh-CN'],

//     ns: ['translation', 'rpc', 'message'],
//     defaultNS: 'translation',

//     interpolation: { escapeValue: false },
//   });

export default i18next;
