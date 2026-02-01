import { app, BrowserWindow, IpcMain } from 'electron';
import Store from 'electron-store';
import fontList from 'font-list';
import * as Types from './types';
import { registerSharedSettingsHandlers } from './settings.shared.ipc';

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

  // 1. Register Shared Handlers (Pure Logic)
  registerSharedSettingsHandlers(ipcMain, store, getSettings);

  // 2. Register Electron-Only Handlers (Side Effects / Native APIs)

  ipcMain.on('get-auto-launch', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-launch', enable);
    });
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

  ipcMain.on('get-record-save-path', (event) => {
    event.returnValue = store.get('recordSavePath');
  });

  ipcMain.on('set-record-save-path', (_, path) => {
    store.set('recordSavePath', path ?? app.getPath('documents'));
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('record-save-path', path);
    });
  });

  ipcMain.on('set-auto-check-for-updates', (_, enable) => {
    store.set('autoCheckForUpdates', enable ?? false);
    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-check-for-updates', enable);
    });
  });
}