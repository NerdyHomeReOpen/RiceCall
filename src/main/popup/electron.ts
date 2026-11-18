import { ipcMain } from 'electron';

import type * as Types from '@/types';

import Logger from '@/utils/logger';

import { loadPopupData } from '@/main/popup/initial-data-loader';
import { broadcast, closeAllPopups, createPopup, getSettings, popups } from '@/main/electron';

export function registerPopupHandlers(): void {
  ipcMain.on('open-popup', async (_, type: Types.PopupType, id: string, initialData: Types.PopupOpenData<Types.PopupType>, force = true) => {
    new Logger('SYSTEM').info(`Opening ${type} (${id})...`);

    const popupData = await loadPopupData(type, initialData ?? {}, getSettings()).catch(() => {
      new Logger('SYSTEM').error(`Cannot load ${type} data, aborting...`);
      return null;
    });
    if (!popupData) return;

    createPopup(type, id, popupData, force);
  });

  ipcMain.on('close-popup', (_, id: string) => {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].close();
    }
  });

  ipcMain.on('close-all-popups', () => {
    closeAllPopups();
  });

  ipcMain.on('popup-submit', (_, to: string, data: unknown | null = null) => {
    broadcast(`popup-submit-${to}`, data);
  });
}
