import { app, BrowserWindow, IpcMain } from 'electron';
import Store from 'electron-store';
import fontList from 'font-list';
import * as Types from '@/types';
import { ElectronIpcRouter } from '@/platform/ipc/router';
import { registerSharedSettingsHandlers } from '../shared/settings';

export interface SettingsDependencies {
  store: Store<Types.StoreType>;
  setAutoLaunch: (enable: boolean) => void;
  isAutoLaunchEnabled: () => boolean;
  startCheckForUpdates: () => void;
  stopCheckForUpdates: () => void;
  getSettings: () => Types.SystemSettings;
}

export function registerSettingsHandlers(ipcMain: IpcMain, deps: SettingsDependencies) {
  const { store, setAutoLaunch, isAutoLaunchEnabled, startCheckForUpdates, stopCheckForUpdates, getSettings } = deps;

  const router = new ElectronIpcRouter(ipcMain);

  // Broadcast to all windows
  // eslint-disable-next-line
  const broadcast = (channel: string, value: any) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channel, value);
    });
  };

  // 1. Register Shared Handlers
  registerSharedSettingsHandlers(router, store, broadcast, getSettings);

  // 2. Register Electron-Only Handlers (Side Effects / Native APIs)

  ipcMain.on('get-auto-launch', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable ?? false);
    broadcast('auto-launch', enable);
  });

  ipcMain.on('set-always-on-top', (_, enable) => {
    store.set('alwaysOnTop', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setAlwaysOnTop(enable);
      window.webContents.send('always-on-top', enable);
    });
  });

  ipcMain.on('get-font-list', async (event) => {
    const fonts = await fontList.getFonts();
    event.returnValue = fonts;
  });

  ipcMain.on('set-record-save-path', (_, path) => {
    store.set('recordSavePath', path ?? app.getPath('documents'));
    broadcast('record-save-path', path);
  });

  ipcMain.on('set-auto-check-for-updates', (_, enable) => {
    store.set('autoCheckForUpdates', enable ?? false);
    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();
    broadcast('auto-check-for-updates', enable);
  });
}
