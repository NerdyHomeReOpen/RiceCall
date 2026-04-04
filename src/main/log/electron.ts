import { ipcMain } from 'electron';

import Logger from '@/logger';

export function registerLogHandlers() {
  ipcMain.on('electron-log-info', (_, ...args) => {
    new Logger('System').info(args.join(' '));
  });

  ipcMain.on('electron-log-warn', (_, ...args) => {
    new Logger('System').warn(args.join(' '));
  });

  ipcMain.on('electron-log-error', (_, ...args) => {
    new Logger('System').error(args.join(' '));
  });
}
