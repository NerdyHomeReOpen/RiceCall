/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRouter } from '../../router';

export interface AuthProvider {
  login: (formData: any) => Promise<any>;
  logout: () => Promise<void>;
  register: (formData: any) => Promise<any>;
  autoLogin: (token: string) => Promise<any>;
}

/**
 * Shared Auth IPC Registration.
 * This file is TRULY shared as it defines the IPC protocol for both platforms.
 * It delegates the actual logic to the provided AuthProvider.
 */
export function registerAuthIpcHandlers(ipc: IpcRouter, provider: AuthProvider) {
  ipc.handle('auth-login', async (_, formData: any) => {
    return await provider.login(formData);
  });

  ipc.handle('auth-logout', async () => {
    return await provider.logout();
  });

  ipc.handle('auth-register', async (_, formData: any) => {
    return await provider.register(formData);
  });

  ipc.handle('auth-auto-login', async (_, token: string) => {
    return await provider.autoLogin(token);
  });
}
