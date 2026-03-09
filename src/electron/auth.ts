import { ipcMain } from 'electron';

import { connectSocket, disconnectSocket } from '@/electron/socket';
import { createPopup, closeAllPopups } from '@/electron/main';
import { mainWindow, authWindow } from '@/electron/main';
import { setTrayDetail } from '@/electron/tray';

import * as Auth from '@/auth';
import { setToken, removeToken } from '@/token';

export async function login(formData: { account: string; password: string }) {
  return await Auth.login(formData)
    .then((res) => {
      if (res.success) {
        setToken(res.token);
        connectSocket(res.token);
        setTrayDetail(true);
        mainWindow?.showInactive();
        authWindow?.hide();
      }
      return res;
    })
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

export async function logout() {
  removeToken();
  disconnectSocket();
  setTrayDetail(false);
  mainWindow?.reload();
  mainWindow?.hide();
  authWindow?.showInactive();
  closeAllPopups();
}

async function register(formData: { account: string; password: string; email: string; username: string; locale: string }) {
  return await Auth.register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

async function autoLogin(token: string) {
  return await Auth.autoLogin(token)
    .then((res) => {
      if (res.success) {
        setToken(res.token);
        connectSocket(res.token);
        setTrayDetail(true);
        mainWindow?.showInactive();
        authWindow?.hide();
      }
      return res;
    })
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

export function registerAuthHandlers() {
  ipcMain.handle('auth-login', async (_, formData: { account: string; password: string }) => {
    return await login(formData);
  });

  ipcMain.handle('auth-logout', async () => {
    return await logout();
  });

  ipcMain.handle('auth-register', async (_, formData: { account: string; password: string; email: string; username: string; locale: string }) => {
    return await register(formData);
  });

  ipcMain.handle('auth-auto-login', async (_, token: string) => {
    return await autoLogin(token);
  });
}
