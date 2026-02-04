/* eslint-disable @typescript-eslint/no-explicit-any */
import * as AuthService from '@/auth.service';

/**
 * Web Implementation of Auth Logic (Mocking Main Process)
 */
export const createWebAuthProvider = (storage: any) => ({
  login: async (formData: any) => {
    try {
      return await AuthService.login(formData);
    } catch (e) {
      console.error('[WebAuth] Login failed:', e);
      return { success: false };
    }
  },

  logout: async () => {
    storage.delete('token');
    storage.delete('userId');
    storage.delete('login-account');
  },

  register: async (formData: any) => {
    try {
      return await AuthService.register(formData);
    } catch (e) {
      console.error('[WebAuth] Register failed:', e);
      return { success: false };
    }
  },

  autoLogin: async (token: string) => {
    try {
      return await AuthService.autoLogin(token);
    } catch (e: unknown) {
      console.error('[WebAuth] AutoLogin failed:', e);
      return { success: false, message: e instanceof Error ? e.message : 'network-error' };
    }
  },
});
