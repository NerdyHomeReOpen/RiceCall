import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Types
import type { LanguageKey } from '../types';

// Constants
import { LANGUAGES } from '../constant.js';

// en-US
import enUS_system from '../i18n/locales/en-US/system.json' with { type: 'json' };

// es-ES
import esES_system from '../i18n/locales/es-ES/system.json' with { type: 'json' };

// fa-IR
import faIR_system from '../i18n/locales/fa-IR/system.json' with { type: 'json' };

// pt-BR
import ptBR_system from '../i18n/locales/pt-BR/system.json' with { type: 'json' };

// ru-RU
import ruRU_system from '../i18n/locales/ru-RU/system.json' with { type: 'json' };

// tr-TR
import trTR_system from '../i18n/locales/tr-TR/system.json' with { type: 'json' };

// zh-CN
import zhCN_system from '../i18n/locales/zh-CN/system.json' with { type: 'json' };

// zh-TW
import zhTW_system from '../i18n/locales/zh-TW/system.json' with { type: 'json' };

export async function initMainI18n(language: string) {
  i18next.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'zh-TW',
    supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

    ns: ['system'],
    defaultNS: 'system',
    fallbackNS: false,

    resources: {
      'en-US': { system: enUS_system },
      'es-ES': { system: esES_system },
      'fa-IR': { system: faIR_system },
      'pt-BR': { system: ptBR_system },
      'ru-RU': { system: ruRU_system },
      'tr-TR': { system: trTR_system },
      'zh-CN': { system: zhCN_system },
      'zh-TW': { system: zhTW_system },
    },

    interpolation: { escapeValue: false },
  });
}

export function t(key: string, params?: Record<string, string>) {
  return i18next.t(key, params);
}

export function getLanguage(): LanguageKey {
  const language = Intl.DateTimeFormat().resolvedOptions().locale;

  const match = LANGUAGES.find(({ code }) => code.includes(language));
  if (!match) return 'en-US';

  return match.code;
}
