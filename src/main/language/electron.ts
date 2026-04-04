import { ipcMain } from 'electron';

import * as Types from '@/types';

import { changeLanguage } from '@/i18n';

import { store, broadcast, getRegion, setTrayDetail } from '@/main/electron';

export function registerLanguageHandlers() {
  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language');
  });

  ipcMain.on('set-language', (_, language: Types.LanguageKey = getRegion()) => {
    store.set('language', language);
    changeLanguage(language);
    setTrayDetail();
    broadcast('language', language);
  });
}
