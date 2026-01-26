/**
 * Web Auth Implementation
 */

import type { AuthController } from './types';
import type { IpcRenderer } from '@/platform/ipc/types';

export function createWebAuthController(getIpc: () => IpcRenderer): AuthController {
  return {
    async logout(): Promise<void> {
      // Invoke common logout handler to clear storage/data
      await getIpc().invoke('auth-logout');
      
      // Explicitly redirect to auth page in web mode
      // Small delay to ensure storage writes are committed
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 100);
      }
    },
    async loginSuccess(): Promise<void> {
      // In web mode, redirect to the root page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
  };
}
