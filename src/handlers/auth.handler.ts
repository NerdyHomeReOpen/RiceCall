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
        // Clear stored credentials
        ctx.storage.delete('token');
        ctx.storage.delete('userId');
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
          const res = await ctx.api.post<{ token?: string }>('/token/verify', {
            token,
            version: packageJson.version,
          });
          if (!res?.token) return { success: false };
          return { success: true, token: res.token };
        } catch (e) {
          console.error('[Auth] AutoLogin failed:', e);
          return { success: false };
        }
      },
    },
  };
}
