/**
 * Auth handlers - shared between Electron and Web.
 * Provides login, logout, register, autoLogin.
 */

import type { HandlerContext, HandlerRegistration } from '@/platform/ipc/types';
import packageJson from '../../package.json';

export interface AuthResult {
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * Create auth handlers.
 */
export function createAuthHandlers(): HandlerRegistration {
  return {
    async: {
      'auth-login': async (
        ctx: HandlerContext,
        formData: { account: string; password: string }
      ): Promise<AuthResult> => {
        try {
          const res = await ctx.api.post<{ token?: string }>('/account/login', {
            ...formData,
            version: packageJson.version,
          });
          if (!res?.token) return { success: false };
          return { success: true, token: res.token };
        } catch (e) {
          console.error('[Auth] Login failed:', e);
          return { success: false };
        }
      },

      'auth-logout': async (ctx: HandlerContext): Promise<void> => {
        // Clear all stored credentials and session markers
        ctx.storage.delete('token');
        ctx.storage.delete('userId');
        ctx.storage.delete('login-account');
      },

      'auth-register': async (
        ctx: HandlerContext,
        formData: { account: string; password: string; email: string; username: string; locale: string }
      ): Promise<AuthResult> => {
        try {
          await ctx.api.post('/account/register', formData);
          return { success: true, message: 'ok' };
        } catch (e) {
          console.error('[Auth] Register failed:', e);
          return { success: false };
        }
      },

      'auth-auto-login': async (ctx: HandlerContext, token: string): Promise<AuthResult> => {
        try {
          const res = await ctx.api.post<{ token?: string; message?: string }>('/token/verify', {
            token,
            version: packageJson.version,
          });
          if (!res?.token) return { success: false, message: res?.message || 'invalid-token' };
          return { success: true, token: res.token };
        } catch (e: unknown) {
          console.error('[Auth] AutoLogin failed:', e);
          const errorMessage = e instanceof Error ? e.message : 'network-error';
          return { success: false, message: errorMessage };
        }
      },
    },
  };
}
