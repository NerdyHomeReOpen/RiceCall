import { login as _login, register as _register, autoLogin as _autoLogin } from '@/api/auth';
import { setToken, removeToken } from '@/token';

import { createPopup, store } from '@/main/web';
import { connectSocket, disconnectSocket } from '@/main/socket/web';

export async function login(formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> {
  return await _login(formData)
    .then((res) => {
      if (res.success) {
        store.set('token', res.token);
        setToken(res.token);
        window.location.href = '/';
      }
      return res as { success: true; token: string };
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
  window.location.href = '/auth';
}

export async function register(formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> {
  return await _register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  return await _autoLogin(token)
    .then((res) => {
      if (res.success) {
        store.set('token', res.token);
        setToken(res.token);
        connectSocket(token);
      } else {
        store.set('token', '');
        removeToken();
        window.location.href = '/auth';
      }
      return res;
    })
    .catch((e) => {
      store.set('token', '');
      removeToken();
      window.location.href = '/auth';
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}
