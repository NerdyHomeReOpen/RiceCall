/**
 * Auth Platform Factory
 */

import { isElectron, getIpcRenderer } from '@/platform/ipc';
import { createElectronAuthController } from './electron';
import { createWebAuthController } from './web';
import type { AuthController } from './types';

let authController: AuthController | null = null;

/**
 * Get the auth controller singleton for the current platform.
 */
export function getAuthController(): AuthController {
  if (!authController) {
    if (isElectron()) {
      authController = createElectronAuthController(getIpcRenderer);
    } else {
      authController = createWebAuthController(getIpcRenderer);
    }
  }
  return authController;
}

export type { AuthController };
