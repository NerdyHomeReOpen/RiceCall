/**
 * Platform Window Factory
 * 
 * Returns the appropriate window controller based on the current platform.
 */

export type { WindowController } from './types';
import type { WindowController } from './types';
import { isElectron, getIpcRenderer } from '@/platform/ipc';
import { createElectronWindowController } from './electron';
import { createWebWindowController } from './web';

let windowController: WindowController | null = null;

/**
 * Get the window controller singleton for the current platform.
 */
export function getWindowController(): WindowController {
  if (!windowController) {
    if (isElectron()) {
      windowController = createElectronWindowController(getIpcRenderer);
    } else {
      windowController = createWebWindowController(getIpcRenderer);
    }
  }
  return windowController;
}
