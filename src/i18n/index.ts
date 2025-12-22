/* eslint-disable @typescript-eslint/no-explicit-any */
import otaClient from '@crowdin/ota-client';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import Logger from '@/utils/logger';

import enUS_app from './locales/en-US/app.json';
import enUS_message from './locales/en-US/message.json';
import enUS_rpc from './locales/en-US/rpc.json';
import enUS_country from './locales/en-US/country.json';
import enUS_badge from './locales/en-US/badge.json';
import enUS_position from './locales/en-US/position.json';

// es-ES
import esES_app from './locales/es-ES/app.json';
import esES_message from './locales/es-ES/message.json';
import esES_rpc from './locales/es-ES/rpc.json';
import esES_country from './locales/es-ES/country.json';
import esES_badge from './locales/es-ES/badge.json';
import esES_position from './locales/es-ES/position.json';

// fa-IR
import faIR_app from './locales/fa-IR/app.json';
import faIR_message from './locales/fa-IR/message.json';
import faIR_rpc from './locales/fa-IR/rpc.json';
import faIR_country from './locales/fa-IR/country.json';
import faIR_badge from './locales/fa-IR/badge.json';
import faIR_position from './locales/fa-IR/position.json';

// pt-BR
import ptBR_app from './locales/pt-BR/app.json';
import ptBR_message from './locales/pt-BR/message.json';
import ptBR_rpc from './locales/pt-BR/rpc.json';
import ptBR_country from './locales/pt-BR/country.json';
import ptBR_badge from './locales/pt-BR/badge.json';
import ptBR_position from './locales/pt-BR/position.json';

// ru-RU
import ruRU_app from './locales/ru-RU/app.json';
import ruRU_message from './locales/ru-RU/message.json';
import ruRU_rpc from './locales/ru-RU/rpc.json';
import ruRU_country from './locales/ru-RU/country.json';
import ruRU_badge from './locales/ru-RU/badge.json';
import ruRU_position from './locales/ru-RU/position.json';

// tr-TR
import trTR_app from './locales/tr-TR/app.json';
import trTR_message from './locales/tr-TR/message.json';
import trTR_rpc from './locales/tr-TR/rpc.json';
import trTR_country from './locales/tr-TR/country.json';
import trTR_badge from './locales/tr-TR/badge.json';
import trTR_position from './locales/tr-TR/position.json';

// zh-CN
import zhCN_app from './locales/zh-CN/app.json';
import zhCN_message from './locales/zh-CN/message.json';
import zhCN_rpc from './locales/zh-CN/rpc.json';
import zhCN_country from './locales/zh-CN/country.json';
import zhCN_badge from './locales/zh-CN/badge.json';
import zhCN_position from './locales/zh-CN/position.json';

// zh-TW
import zhTW_app from './locales/zh-TW/app.json';
import zhTW_message from './locales/zh-TW/message.json';
import zhTW_rpc from './locales/zh-TW/rpc.json';
import zhTW_country from './locales/zh-TW/country.json';
import zhTW_badge from './locales/zh-TW/badge.json';
import zhTW_position from './locales/zh-TW/position.json';

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

// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    new Logger('i18n').warn(`Not in Electron environment: ${error}`);
  }
}

const getHash = () => ipcRenderer?.sendSync('get-env')?.CROWDIN_DISTRIBUTION_HASH || '';

const toCrowdin = (lng: string) => APP_TO_CROWDIN[lng.replace('_', '-') as Types.LanguageKey] ?? lng;

/** OTA backend */
class CrowdinBackend {
  type = 'backend' as const;
  client = new otaClient(getHash());
  read(lng: string, _ns: string, cb: any) {
    const crowdinLng = toCrowdin(lng);
    this.client
      .getStringsByLocale(crowdinLng)
      .then((data: any) => cb(null, data))
      .catch((err: any) => cb(err, null));
  }
}

(async () => {
  if (getHash()) {
    i18next
      .use(new CrowdinBackend())
      .use(initReactI18next)
      .init({
        lng: 'zh-TW',
        fallbackLng: 'zh-TW',
        supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

        ns: ['app', 'rpc', 'message', 'country', 'badge', 'position'],
        defaultNS: 'app',
        fallbackNS: false,

        interpolation: { escapeValue: false },
        load: 'currentOnly' as const,
        nonExplicitSupportedLngs: false,
      });
  } else {
    i18next.use(initReactI18next).init({
      lng: 'zh-TW',
      fallbackLng: 'zh-TW',
      supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

      ns: ['app', 'rpc', 'message', 'country', 'badge', 'position'],
      defaultNS: 'app',
      fallbackNS: false,

      resources: {
        'en-US': { app: enUS_app, rpc: enUS_rpc, message: enUS_message, country: enUS_country, badge: enUS_badge, position: enUS_position },
        'es-ES': { app: esES_app, rpc: esES_rpc, message: esES_message, country: esES_country, badge: esES_badge, position: esES_position },
        'fa-IR': { app: faIR_app, rpc: faIR_rpc, message: faIR_message, country: faIR_country, badge: faIR_badge, position: faIR_position },
        'pt-BR': { app: ptBR_app, rpc: ptBR_rpc, message: ptBR_message, country: ptBR_country, badge: ptBR_badge, position: ptBR_position },
        'ru-RU': { app: ruRU_app, rpc: ruRU_rpc, message: ruRU_message, country: ruRU_country, badge: ruRU_badge, position: ruRU_position },
        'tr-TR': { app: trTR_app, rpc: trTR_rpc, message: trTR_message, country: trTR_country, badge: trTR_badge, position: trTR_position },
        'zh-CN': { app: zhCN_app, rpc: zhCN_rpc, message: zhCN_message, country: zhCN_country, badge: zhCN_badge, position: zhCN_position },
        'zh-TW': { app: zhTW_app, rpc: zhTW_rpc, message: zhTW_message, country: zhTW_country, badge: zhTW_badge, position: zhTW_position },
      },

      interpolation: { escapeValue: false },
    });
  }
})();

export default i18next;
