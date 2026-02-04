/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserWindow, IpcMain, session } from 'electron';
import * as AuthService from '@/auth.service';
import { setToken } from '@/auth.token';
import { ElectronIpcRouter } from '@/platform/ipc/router';
import { registerAuthIpcHandlers, AuthProvider } from '../shared/auth';
import Logger from '@/logger';

export interface AuthDependencies {
  store: any;
  isLogin: (val?: boolean) => boolean;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  setTrayDetail: () => void;
  getMainWindow: () => BrowserWindow | null;
  getAuthWindow: () => BrowserWindow | null;
  createPopup: (type: any, id: string, initialData: any, force?: boolean) => void;
  closePopups: () => void;
  BASE_URI: string;
  DEV: boolean;
}

export function registerAuthHandlers(ipcMain: IpcMain, deps: AuthDependencies) {
  const { store, isLogin, connectSocket, disconnectSocket, setTrayDetail, getMainWindow, getAuthWindow, createPopup, closePopups, BASE_URI, DEV } = deps;

  // Implement the AuthProvider interface for Electron
  const electronProvider: AuthProvider = {
    login: async (formData: any) => {
      return await AuthService.login(formData)
        .then((res) => {
          if (res.success) {
            setToken(res.token);
            store.set('token', res.token);
            isLogin(true);
            getMainWindow()?.showInactive();
            getAuthWindow()?.hide();
            connectSocket(res.token);
            setTrayDetail();
          }
          return res;
        })
        .catch((error) => {
          createPopup('dialogError', 'dialogError', { message: error.message, timestamp: Date.now() }, true);
          return { success: false };
        });
    },

    logout: async () => {
      new Logger('Auth').info('Logout: starting...');

      // 1. Clear Memory & Persistence
      setToken('');
      store.delete('token');
      store.delete('userId');
      store.delete('login-account');

      // 2. Clear Session Data (localStorage, cookies, etc.) across all windows
      // This is the strongest way to prevent auto-login loops
      await session.defaultSession.clearStorageData({
        storages: ['localstorage', 'cookies', 'indexdb'],
      });

      isLogin(false);
      closePopups();
      disconnectSocket();

      const mainWindow = getMainWindow();
      mainWindow?.hide();

      // 3. Load Auth Page with a small delay to ensure cleanup is committed
      const authWindow = getAuthWindow();
      const authUrl = DEV ? `${BASE_URI}/auth` : `${BASE_URI}/auth.html`;

      new Logger('Auth').info(`Logout: loading auth page in authWindow...`);
      setTimeout(() => {
        authWindow?.loadURL(authUrl);
        authWindow?.show();
        setTrayDetail();
        new Logger('Auth').info('Logout: done');
      }, 200);
    },

    register: async (formData: any) => {
      return await AuthService.register(formData).catch((error: any) => {
        createPopup('dialogError', 'dialogError', { message: error.message, timestamp: Date.now() }, true);
        return { success: false };
      });
    },

    autoLogin: async (token: string) => {
      return await AuthService.autoLogin(token)
        .then((res) => {
          if (res.success) {
            setToken(res.token);
            store.set('token', res.token);
            isLogin(true);
            getMainWindow()?.showInactive();
            getAuthWindow()?.hide();
            connectSocket(res.token);
            setTrayDetail();
          } else {
            store.delete('token');
          }
          return res;
        })
        .catch((error) => {
          store.delete('token');
          createPopup('dialogError', 'dialogError', { message: error.message, timestamp: Date.now() }, true);
          return { success: false };
        });
    },
  };

  const router = new ElectronIpcRouter(ipcMain);

  // Use the shared registrar to bind channels to our provider
  registerAuthIpcHandlers(router, electronProvider);
}
