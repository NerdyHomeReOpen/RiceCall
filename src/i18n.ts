import i18n from 'i18next';
import Backend from 'i18next-locize-backend';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import jaJP from './locales/ja-JP/translation.json';
import ptBR from './locales/pt-BR/translation.json';
import ru from './locales/ru/translation.json';
import zhHantTW from './locales/zh-Hant-TW/translation.json';
import zhHansCN from './locales/zh-Hans-CN/translation.json';

export type LanguageKey = 'en' | 'ru' | 'ja-JP' | 'pt-BR' | 'zh-Hant-TW' | 'zh-Hans-CN';

const DEV = process.env.NODE_ENV === 'development';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    backend: {
      projectId: DEV ? process.env.NEXT_PUBLIC_LOCIZE_PROJECT_ID : '',
      apiKey: DEV ? process.env.NEXT_PUBLIC_LOCIZE_API_KEY : '',
      referenceLng: 'zh-Hant-TW',
    },
    resources: {
      'en': { translation: en },
      'ru': { translation: ru },
      'ja-JP': { translation: jaJP },
      'pt-BR': { translation: ptBR },
      'zh-Hant-TW': { translation: zhHantTW },
      'zh-Hans-CN': { translation: zhHansCN },
    },
    lng: 'zh-Hant-TW',
    fallbackLng: 'zh-Hant-TW',
    saveMissing: true,
    debug: DEV,
    interpolation: { escapeValue: false },
  });

export default i18n;
