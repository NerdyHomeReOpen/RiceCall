import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import jaJP from './locales/ja-JP/translation.json';
import ptBR from './locales/pt-BR/translation.json';
import zhHantTW from './locales/zh-Hant-TW/translation.json';
import zhHansCN from './locales/zh-Hans-CN/translation.json';

export type LanguageKey = 'en' | 'ja-JP' | 'pt-BR' | 'zh-Hant-TW' | 'zh-Hans-CN';

i18n.use(initReactI18next).init({
  resources: {
    'en': { translation: en },
    'ja-JP': { translation: jaJP },
    'pt-BR': { translation: ptBR },
    'zh-Hant-TW': { translation: zhHantTW },
    'zh-Hans-CN': { translation: zhHansCN },
  },
  lng: 'zh-Hant-TW',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
