import { ipcMain } from 'electron';

import * as Types from '@/types';

import { broadcast, closeAllPopups, createPopup, getSettings, popups } from '@/electron/main';

import Logger from '@/logger';
import * as Loader from '@/loader';

export function registerPopupHandlers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcMain.on('open-popup', async (_, type: Types.PopupType, id: string, initialData: any, force = true) => {
    new Logger('System').info(`Opening ${type} (${id})...`);

    if (typeof initialData !== 'object' || initialData === null) {
      initialData = {};
    }

    const loader = Loader[type as keyof typeof Loader];
    if (loader)
      initialData = await loader({ ...initialData, systemSettings: getSettings() }).catch(() => {
        new Logger('System').error(`Cannot load ${type} data, aborting...`);
        return null;
      });
    if (!initialData) return;

    createPopup(type, id, initialData, force);
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
