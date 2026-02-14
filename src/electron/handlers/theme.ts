import fs from 'fs';
import path from 'path';
import { app, ipcMain } from 'electron';

import * as Types from '@/types';

import { broadcast, store } from '@/electron/main';

import Logger from '@/logger';

export function registerThemeHandlers() {
  ipcMain.on('get-custom-themes', (event) => {
    const customThemes = store.get('customThemes');
    event.returnValue = Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
  });

  ipcMain.on('add-custom-theme', (_, theme: Types.Theme) => {
    const customThemes = store.get('customThemes');
    // Keep total 7 themes
    customThemes.unshift(theme);
    store.set('customThemes', customThemes);
    broadcast(
      'custom-themes',
      Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
    );
  });

  ipcMain.on('delete-custom-theme', (_, index: number) => {
    const customThemes = store.get('customThemes');
    // Keep total 7 themes
    customThemes.splice(index, 1);
    store.set('customThemes', customThemes);
    broadcast(
      'custom-themes',
      Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
    );
  });

  ipcMain.on('get-current-theme', (event) => {
    event.returnValue = store.get('currentTheme');
  });

  ipcMain.on('set-current-theme', (_, theme: Types.Theme) => {
    store.set('currentTheme', theme);
    broadcast('current-theme', theme);
  });

  ipcMain.handle('save-image', async (_, buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
    try {
      const userDataPath = app.getPath('userData');
      const dirPath = path.join(userDataPath, directory);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const timestamp = Date.now();
      const fileName = `${filenamePrefix}-${timestamp}.${extension}`;
      const filePath = path.join(dirPath, fileName);

      fs.writeFileSync(filePath, Buffer.from(buffer));

      return `local-resource://${directory}/${fileName}`;
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('FileStorage').error(`Electron Storage Error: ${error.message}`);
      return null;
    }
  });
}
