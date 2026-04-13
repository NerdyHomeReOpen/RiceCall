import { ipcMain } from 'electron';

import { setToken, removeToken } from '@/api';
import { login as _login, register as _register, autoLogin as _autoLogin } from '@/api/auth';

import { createPopup, closeAllPopups, mainWindow, authWindow, store, setTrayDetail } from '@/main/electron';
import { connectSocket, disconnectSocket } from '@/main/socket/electron';

export async function login(formData: { account: string; password: string }) {
  return await _login(formData)
    .then((res) => {
      if (res.success) {
        store.set('token', res.token);
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
  store.set('token', '');
  removeToken();
  disconnectSocket();
  setTrayDetail(false);
  mainWindow?.reload();
  mainWindow?.hide();
  authWindow?.showInactive();
  closeAllPopups();
}

async function register(formData: { account: string; password: string; email: string; username: string; locale: string }) {
  return await _register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

export async function autoLogin(token: string) {
  return await _autoLogin(token)
    .then((res) => {
      if (res.success) {
        store.set('token', res.token);
        setToken(res.token);
        connectSocket(res.token);
        setTrayDetail(true);
        mainWindow?.showInactive();
        authWindow?.hide();
      } else {
        store.set('token', '');
        removeToken();
      }
      return res;
    })
    .catch((e) => {
      store.set('token', '');
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
