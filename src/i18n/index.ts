import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import { isMain } from '@/utils/platform';

import { getEnv } from '@/env';

import enUS_app from './locales/en-US/app.json' with { type: 'json' };
import enUS_message from './locales/en-US/message.json' with { type: 'json' };
import enUS_rpc from './locales/en-US/rpc.json' with { type: 'json' };
import enUS_country from './locales/en-US/country.json' with { type: 'json' };
import enUS_badge from './locales/en-US/badge.json' with { type: 'json' };
import enUS_position from './locales/en-US/position.json' with { type: 'json' };
import enUS_system from './locales/en-US/system.json' with { type: 'json' };

// es-ES
import esES_app from './locales/es-ES/app.json' with { type: 'json' };
import esES_message from './locales/es-ES/message.json' with { type: 'json' };
import esES_rpc from './locales/es-ES/rpc.json' with { type: 'json' };
import esES_country from './locales/es-ES/country.json' with { type: 'json' };
import esES_badge from './locales/es-ES/badge.json' with { type: 'json' };
import esES_position from './locales/es-ES/position.json' with { type: 'json' };
import esES_system from './locales/es-ES/system.json' with { type: 'json' };

// fa-IR
import faIR_app from './locales/fa-IR/app.json' with { type: 'json' };
import faIR_message from './locales/fa-IR/message.json' with { type: 'json' };
import faIR_rpc from './locales/fa-IR/rpc.json' with { type: 'json' };
import faIR_country from './locales/fa-IR/country.json' with { type: 'json' };
import faIR_badge from './locales/fa-IR/badge.json' with { type: 'json' };
import faIR_position from './locales/fa-IR/position.json' with { type: 'json' };
import faIR_system from './locales/fa-IR/system.json' with { type: 'json' };

// pt-BR
import ptBR_app from './locales/pt-BR/app.json' with { type: 'json' };
import ptBR_message from './locales/pt-BR/message.json' with { type: 'json' };
import ptBR_rpc from './locales/pt-BR/rpc.json' with { type: 'json' };
import ptBR_country from './locales/pt-BR/country.json' with { type: 'json' };
import ptBR_badge from './locales/pt-BR/badge.json' with { type: 'json' };
import ptBR_position from './locales/pt-BR/position.json' with { type: 'json' };
import ptBR_system from './locales/pt-BR/system.json' with { type: 'json' };

// ru-RU
import ruRU_app from './locales/ru-RU/app.json' with { type: 'json' };
import ruRU_message from './locales/ru-RU/message.json' with { type: 'json' };
import ruRU_rpc from './locales/ru-RU/rpc.json' with { type: 'json' };
import ruRU_country from './locales/ru-RU/country.json' with { type: 'json' };
import ruRU_badge from './locales/ru-RU/badge.json' with { type: 'json' };
import ruRU_position from './locales/ru-RU/position.json' with { type: 'json' };
import ruRU_system from './locales/ru-RU/system.json' with { type: 'json' };

// tr-TR
import trTR_app from './locales/tr-TR/app.json' with { type: 'json' };
import trTR_message from './locales/tr-TR/message.json' with { type: 'json' };
import trTR_rpc from './locales/tr-TR/rpc.json' with { type: 'json' };
import trTR_country from './locales/tr-TR/country.json' with { type: 'json' };
import trTR_badge from './locales/tr-TR/badge.json' with { type: 'json' };
import trTR_position from './locales/tr-TR/position.json' with { type: 'json' };
import trTR_system from './locales/tr-TR/system.json' with { type: 'json' };

// zh-CN
import zhCN_app from './locales/zh-CN/app.json' with { type: 'json' };
import zhCN_message from './locales/zh-CN/message.json' with { type: 'json' };
import zhCN_rpc from './locales/zh-CN/rpc.json' with { type: 'json' };
import zhCN_country from './locales/zh-CN/country.json' with { type: 'json' };
import zhCN_badge from './locales/zh-CN/badge.json' with { type: 'json' };
import zhCN_position from './locales/zh-CN/position.json' with { type: 'json' };
import zhCN_system from './locales/zh-CN/system.json' with { type: 'json' };

// zh-TW
import zhTW_app from './locales/zh-TW/app.json' with { type: 'json' };
import zhTW_message from './locales/zh-TW/message.json' with { type: 'json' };
import zhTW_rpc from './locales/zh-TW/rpc.json' with { type: 'json' };
import zhTW_country from './locales/zh-TW/country.json' with { type: 'json' };
import zhTW_badge from './locales/zh-TW/badge.json' with { type: 'json' };
import zhTW_position from './locales/zh-TW/position.json' with { type: 'json' };
import zhTW_system from './locales/zh-TW/system.json' with { type: 'json' };

const APP_TO_CROWDIN: Record<Types.LanguageKey, string> = {
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh-CN',
  'en-US': 'en',
  'fa-IR': 'fa',
  'pt-BR': 'pt-BR',
  'ru-RU': 'ru',
  'es-ES': 'es-ES',
  'tr-TR': 'tr',
};

const getHash = () => getEnv().CROWDIN_DISTRIBUTION_HASH || '';

/** OTA backend */
class CrowdinBackend {
  type = 'backend' as const;
  client = new otaClient(getHash());
  read(lng: string, _ns: string, cb: (error: Error | null, data: Record<string, unknown> | null) => void) {
    const crowdinLng = APP_TO_CROWDIN[lng.replace('_', '-') as Types.LanguageKey] ?? lng;
    this.client
      .getStringsByLocale(crowdinLng)
      .then((data: Record<string, unknown>) => cb(null, data))
      .catch((error: Error) => cb(error, null));
  }
}

(async () => {
  if (!isMain() && getHash()) {
    i18next
      .use(new CrowdinBackend())
      .use(initReactI18next)
      .init({
        lng: 'zh-TW',
        fallbackLng: 'zh-TW',
        supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

        ns: ['app', 'rpc', 'message', 'country', 'badge', 'position', 'system'],
        defaultNS: 'app',
        fallbackNS: ['message'],

        interpolation: { escapeValue: false },
        load: 'currentOnly' as const,
        nonExplicitSupportedLngs: false,
      });
  } else {
    i18next.use(initReactI18next).init({
      lng: 'zh-TW',
      fallbackLng: 'zh-TW',
      supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

      ns: ['app', 'rpc', 'message', 'country', 'badge', 'position', 'system'],
      defaultNS: 'app',
      fallbackNS: ['message'],

      resources: {
        'en-US': { app: enUS_app, rpc: enUS_rpc, message: enUS_message, country: enUS_country, badge: enUS_badge, position: enUS_position, system: enUS_system },
        'es-ES': { app: esES_app, rpc: esES_rpc, message: esES_message, country: esES_country, badge: esES_badge, position: esES_position, system: esES_system },
        'fa-IR': { app: faIR_app, rpc: faIR_rpc, message: faIR_message, country: faIR_country, badge: faIR_badge, position: faIR_position, system: faIR_system },
        'pt-BR': { app: ptBR_app, rpc: ptBR_rpc, message: ptBR_message, country: ptBR_country, badge: ptBR_badge, position: ptBR_position, system: ptBR_system },
        'ru-RU': { app: ruRU_app, rpc: ruRU_rpc, message: ruRU_message, country: ruRU_country, badge: ruRU_badge, position: ruRU_position, system: ruRU_system },
        'tr-TR': { app: trTR_app, rpc: trTR_rpc, message: trTR_message, country: trTR_country, badge: trTR_badge, position: trTR_position, system: trTR_system },
        'zh-CN': { app: zhCN_app, rpc: zhCN_rpc, message: zhCN_message, country: zhCN_country, badge: zhCN_badge, position: zhCN_position, system: zhCN_system },
        'zh-TW': { app: zhTW_app, rpc: zhTW_rpc, message: zhTW_message, country: zhTW_country, badge: zhTW_badge, position: zhTW_position, system: zhTW_system },
      },

      interpolation: { escapeValue: false },
    });
  }
})();

export function t(key: string, params?: Record<string, string>) {
  return i18next.t(key, params);
}

export function changeLanguage(language: Types.LanguageKey) {
  i18next.changeLanguage(language);
}

export default i18next;
