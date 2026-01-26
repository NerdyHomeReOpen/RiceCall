/**
 * Electron Auth Implementation
 */

import type { AuthController } from './types';
import type { IpcRenderer } from '@/platform/ipc/types';

export function createElectronAuthController(getIpc: () => IpcRenderer): AuthController {
  return {
    async logout(): Promise<void> {
      // In Electron, the main process handles window switching (hide main, show auth)
      await getIpc().invoke('auth-logout');
    },
    async loginSuccess(): Promise<void> {
      // In Electron, mainProcess already handled window switch and socket connection
      // during the auth-login invoke handler.
    },
  };
}
