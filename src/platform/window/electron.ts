/**
 * Electron Window Implementation
 * 
 * Uses IPC to communicate with main process for window control.
 */

import type { WindowController } from './types';
import type { IpcRenderer } from '@/platform/ipc';

export function createElectronWindowController(getIpc: () => IpcRenderer): WindowController {
  return {
    resize(width: number, height: number): void {
      getIpc().send('resize', width, height);
    },

    minimize(): void {
      getIpc().send('window-control-minimize');
    },

    maximize(): void {
      getIpc().send('window-control-maximize');
    },

    unmaximize(): void {
      getIpc().send('window-control-unmaximize');
    },

    close(): void {
      getIpc().send('window-control-close');
    },

    onMaximize(callback: () => void): () => void {
      getIpc().on('maximize', callback);
      return () => getIpc().removeListener('maximize', callback);
    },

    onUnmaximize(callback: () => void): () => void {
      getIpc().on('unmaximize', callback);
      return () => getIpc().removeListener('unmaximize', callback);
    },
  };
}
