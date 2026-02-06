import { BrowserWindow, IpcMain } from 'electron';
import Store from 'electron-store';
import * as Types from '@/types';
import { ElectronIpcRouter } from '@/platform/ipc/router';
import { registerSharedThemesHandlers } from '../shared/themes';

export function registerThemesHandlers(ipcMain: IpcMain, store: Store<Types.StoreType>) {
  const router = new ElectronIpcRouter(ipcMain);

  // Broadcast to all windows
  // eslint-disable-next-line
  const broadcast = (channel: string, value: any) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channel, value);
    });
  };

  registerSharedThemesHandlers(router, store, broadcast);
}
