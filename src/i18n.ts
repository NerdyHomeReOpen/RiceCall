/* eslint-disable @typescript-eslint/no-explicit-any */
import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export type LanguageKey = 'en' | 'ru' | 'ja' | 'pt-BR' | 'zh-TW' | 'zh-CN';

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

export default i18next;
