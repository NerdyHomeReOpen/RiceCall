import { connectSocket, disconnectSocket } from '@/web/socket';
import { createPopup } from '@/web/main';

import * as Auth from '@/auth';
import { setToken, removeToken } from '@/token';

export async function login(formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> {
  return await Auth.login(formData)
    .then((res) => {
      if (res.success) {
        localStorage.setItem('token', res.token);
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
  localStorage.removeItem('token');
  removeToken();
  window.location.href = '/auth';
  disconnectSocket();
}

export async function register(formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> {
  return await Auth.register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  return await Auth.autoLogin(token)
    .then((res) => {
      if (res.success) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        connectSocket(token);
      } else {
        localStorage.removeItem('token');
        removeToken();
        window.location.href = '/auth';
      }
      return res;
    })
    .catch((e) => {
      localStorage.removeItem('token');
      removeToken();
      window.location.href = '/auth';
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}
